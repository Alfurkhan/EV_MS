package com.zukunftai.evidyalaya.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.StudentAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentAssessmentServiceImpl implements StudentAssessmentService {
    private final AssessmentRepository assessments;
    private final AssessmentQuestionRepository questions;
    private final AssessmentAttemptRepository attempts;
    private final AssessmentAnswerRepository answers;
    private final StudentEnrollmentRepository enrollments;
    private final UserRepository users;
    private final AssessmentObjectiveGrader objectiveGrader;

    public StudentAssessmentServiceImpl(AssessmentRepository assessments, AssessmentQuestionRepository questions,
            AssessmentAttemptRepository attempts, AssessmentAnswerRepository answers,
            StudentEnrollmentRepository enrollments, UserRepository users, AssessmentObjectiveGrader objectiveGrader) {
        this.assessments = assessments; this.questions = questions; this.attempts = attempts;
        this.answers = answers; this.enrollments = enrollments; this.users = users;
    }

    @Override @Transactional(readOnly = true)
    public List<StudentAssessmentResponse> listAvailable() {
        User student = currentUser();
        List<StudentEnrollment> active = enrollments.findByStudentAndActiveTrue(student);
        if (active.isEmpty()) return List.of();
        Set<String> classKeys = active.stream().map(e -> key(e.getAcademicYear().getId(), e.getGrade().getId(), e.getSection().getId())).collect(Collectors.toSet());
        LocalDateTime now = LocalDateTime.now();
        return assessments.findAll().stream()
                .filter(a -> a.getStatus() == AssessmentStatus.PUBLISHED)
                .filter(a -> classKeys.contains(key(a.getAcademicYear().getId(), a.getGrade().getId(), a.getSection().getId())))
                .sorted(Comparator.comparing(Assessment::getAvailableFrom))
                .map(a -> {
                    AssessmentAttempt attempt = attempts.findByAssessmentAndStudent(a, student).orElse(null);
                    String availability = now.isBefore(a.getAvailableFrom()) ? "UPCOMING" : now.isAfter(a.getAvailableUntil()) ? "CLOSED" : "OPEN";
                    if (attempt != null) {
                        if (attempt.getStatus() != AssessmentAttemptStatus.IN_PROGRESS) availability = "COMPLETED";
                        else if (Instant.now().isBefore(attempt.getDeadlineAt())) availability = "OPEN";
                        else availability = "CLOSED";
                    }
                    return StudentAssessmentResponse.builder().id(a.getId()).title(a.getTitle()).description(a.getDescription())
                            .assessmentType(a.getAssessmentType()).subjectName(a.getSubject().getName())
                            .facultyName(a.getFaculty().getFullName()).gradeName(a.getGrade().getName()).sectionName(a.getSection().getName())
                            .timingMode(a.getTimingMode()).availableFrom(a.getAvailableFrom()).availableUntil(a.getAvailableUntil())
                            .durationMinutes(a.getDurationMinutes()).totalMarks(a.getTotalMarks()).availability(availability)
                            .attempted(attempt != null).attemptId(attempt == null ? null : attempt.getId())
                            .attemptStatus(attempt == null ? null : attempt.getStatus().name())
                            .attemptDeadline(attempt == null ? null : attempt.getDeadlineAt())
                            .hasAttachment(a.getAttachmentPath() != null).attachmentName(a.getAttachmentName()).build();
                }).toList();
    }

    @Override public StudentAssessmentAttemptResponse start(Long assessmentId) {
        User student = currentUser();
        Assessment assessment = assessments.findById(assessmentId).orElseThrow(() -> error("Assessment not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
        requireEnrollment(student, assessment);
        if (assessment.getStatus() != AssessmentStatus.PUBLISHED) throw error("This assessment is not available.", HttpStatus.FORBIDDEN, "ASSESSMENT_NOT_PUBLISHED");
        Optional<AssessmentAttempt> existing = attempts.findByAssessmentAndStudent(assessment, student);
        if (existing.isPresent()) {
            AssessmentAttempt attempt = existing.get(); autoSubmitIfExpired(attempt);
            if (attempt.getStatus() != AssessmentAttemptStatus.IN_PROGRESS) throw error("You have already submitted this assessment.", HttpStatus.CONFLICT, "ASSESSMENT_ALREADY_ATTEMPTED");
            return toResponse(attempt);
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(assessment.getAvailableFrom()) || !now.isBefore(assessment.getAvailableUntil()))
            throw error("This assessment is outside its availability window.", HttpStatus.CONFLICT, "ASSESSMENT_WINDOW_CLOSED");
        Instant started = Instant.now();
        Instant windowEnd = assessment.getAvailableUntil().atZone(ZoneId.systemDefault()).toInstant();
        Instant deadline = windowEnd;
        if (assessment.getTimingMode() == AssessmentTimingMode.INDIVIDUAL_TIMER) {
            Instant timerEnd = started.plusSeconds(assessment.getDurationMinutes() * 60L);
            deadline = assessment.isAllowOvertime() ? timerEnd : (timerEnd.isBefore(windowEnd) ? timerEnd : windowEnd);
        }
        AssessmentAttempt attempt = attempts.save(AssessmentAttempt.builder().assessment(assessment).student(student)
                .status(AssessmentAttemptStatus.IN_PROGRESS).startedAt(started).deadlineAt(deadline)
                .createdAt(started).updatedAt(started).build());
        return toResponse(attempt);
    }

    @Override
    public StudentAssessmentAttemptResponse getAttempt(Long attemptId) {
        AssessmentAttempt attempt = ownedAttempt(attemptId); autoSubmitIfExpired(attempt); return toResponse(attempt);
    }

    @Override public StudentAssessmentAttemptResponse saveAnswer(Long attemptId, Long questionId, JsonNode answer) {
        AssessmentAttempt attempt = ownedAttempt(attemptId); ensureInProgress(attempt);
        AssessmentQuestion question = questions.findById(questionId)
                .filter(q -> q.getAssessment().getId().equals(attempt.getAssessment().getId()))
                .orElseThrow(() -> error("Question not found for this assessment.", HttpStatus.NOT_FOUND, "ASSESSMENT_QUESTION_NOT_FOUND"));
        Instant now = Instant.now();
        AssessmentAnswer saved = answers.findByAttemptIdAndQuestionId(attemptId, questionId).orElseGet(() ->
                AssessmentAnswer.builder().attempt(attempt).question(question).createdAt(now).build());
        saved.setAnswer(answer); saved.setUpdatedAt(now); answers.save(saved);
        attempt.setUpdatedAt(now); attempts.save(attempt);
        return toResponse(attempt);
    }

    @Override public StudentAssessmentAttemptResponse submit(Long attemptId) {
        AssessmentAttempt attempt = ownedAttempt(attemptId);
        if (attempt.getStatus() == AssessmentAttemptStatus.IN_PROGRESS) {
            Instant now = Instant.now();
            boolean expired = !now.isBefore(attempt.getDeadlineAt());
            attempt.setStatus(expired ? AssessmentAttemptStatus.AUTO_SUBMITTED : AssessmentAttemptStatus.SUBMITTED);
            attempt.setSubmittedAt(now); attempt.setUpdatedAt(now); objectiveGrader.gradeObjectiveAnswers(attempt); attempts.save(attempt);
        }
        return toResponse(attempt);
    }

    private void ensureInProgress(AssessmentAttempt attempt) {
        autoSubmitIfExpired(attempt);
        if (attempt.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
            throw error("This attempt is no longer accepting answers.", HttpStatus.CONFLICT, "ASSESSMENT_ATTEMPT_CLOSED");
    }
    private void autoSubmitIfExpired(AssessmentAttempt attempt) {
        if (attempt.getStatus() == AssessmentAttemptStatus.IN_PROGRESS && !Instant.now().isBefore(attempt.getDeadlineAt())) {
            Instant now = Instant.now(); attempt.setStatus(AssessmentAttemptStatus.AUTO_SUBMITTED);
            attempt.setSubmittedAt(now); attempt.setUpdatedAt(now); objectiveGrader.gradeObjectiveAnswers(attempt); attempts.save(attempt);
        }
    }
    private AssessmentAttempt ownedAttempt(Long id) {
        return attempts.findByIdAndStudent(id, currentUser()).orElseThrow(() -> error("Attempt not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_ATTEMPT_NOT_FOUND"));
    }
    private void requireEnrollment(User student, Assessment assessment) {
        boolean enrolled = enrollments.findByStudentAndActiveTrue(student).stream().anyMatch(e ->
                e.getAcademicYear().getId().equals(assessment.getAcademicYear().getId())
                && e.getGrade().getId().equals(assessment.getGrade().getId())
                && e.getSection().getId().equals(assessment.getSection().getId()));
        if (!enrolled) throw error("You are not enrolled in this assessment's class.", HttpStatus.FORBIDDEN, "ASSESSMENT_NOT_ENROLLED");
    }
    private StudentAssessmentAttemptResponse toResponse(AssessmentAttempt attempt) {
        List<StudentAssessmentQuestionResponse> qs = questions.findByAssessmentIdOrderByPositionAsc(attempt.getAssessment().getId()).stream()
                .map(q -> StudentAssessmentQuestionResponse.builder().id(q.getId()).questionText(q.getQuestionText())
                        .questionType(q.getQuestionType()).options(q.getOptions()).marks(q.getMarks()).position(q.getPosition()).build()).toList();
        List<StudentAssessmentAnswerResponse> saved = answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId()).stream()
                .map(a -> StudentAssessmentAnswerResponse.builder().questionId(a.getQuestion().getId()).answer(a.getAnswer()).build()).toList();
        return StudentAssessmentAttemptResponse.builder().id(attempt.getId()).assessmentId(attempt.getAssessment().getId())
                .assessmentTitle(attempt.getAssessment().getTitle()).status(attempt.getStatus().name()).startedAt(attempt.getStartedAt())
                .deadlineAt(attempt.getDeadlineAt()).submittedAt(attempt.getSubmittedAt()).questions(qs).answers(saved).build();
    }
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        return users.findByUsername(auth.getName()).orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
    }
    private String key(Long year, Long grade, Long section) { return year + ":" + grade + ":" + section; }
    private APIException error(String message, HttpStatus status, String code) { return new APIException(message, status, code); }
}
