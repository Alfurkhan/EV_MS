package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.zukunftai.evidyalaya.service.NotificationService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class FacultyAssessmentEvaluationService {
    private final AssessmentRepository assessments;
    private final AssessmentAttemptRepository attempts;
    private final AssessmentQuestionRepository questions;
    private final AssessmentAnswerRepository answers;
    private final UserRepository users;
    private final NotificationService notificationService;

    public FacultyAssessmentEvaluationService(AssessmentRepository assessments,
            AssessmentAttemptRepository attempts, AssessmentQuestionRepository questions,
            AssessmentAnswerRepository answers, UserRepository users,
            NotificationService notificationService) {
        this.assessments = assessments;
        this.attempts = attempts;
        this.questions = questions;
        this.answers = answers;
        this.users = users;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<FacultyEvaluationAttemptResponse> listAttempts(Long assessmentId) {
        Assessment assessment = ownedAssessment(assessmentId);
        return attempts.findAll().stream()
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .sorted(Comparator.comparing(AssessmentAttempt::getSubmittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FacultyEvaluationAttemptResponse getAttempt(Long assessmentId, Long attemptId) {
        Assessment assessment = ownedAssessment(assessmentId);
        AssessmentAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> error("Submitted attempt not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_ATTEMPT_NOT_FOUND"));
        return toResponse(attempt);
    }

    public FacultyEvaluationAttemptResponse evaluateAnswer(Long assessmentId, Long attemptId,
            Long questionId, FacultyAnswerEvaluationRequest request) {
        Assessment assessment = ownedAssessment(assessmentId);
        AssessmentAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> error("Submitted attempt not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_ATTEMPT_NOT_FOUND"));
        AssessmentQuestion question = questions.findById(questionId)
                .filter(q -> q.getAssessment().getId().equals(assessmentId))
                .orElseThrow(() -> error("Question not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_QUESTION_NOT_FOUND"));
        if (question.getQuestionType() != AssessmentQuestionType.SHORT_ANSWER
                && question.getQuestionType() != AssessmentQuestionType.DESCRIPTIVE) {
            throw error("Only short-answer and descriptive responses can be manually evaluated.",
                    HttpStatus.BAD_REQUEST, "ASSESSMENT_QUESTION_NOT_MANUAL");
        }
        if (request.getMarksAwarded() == null || request.getMarksAwarded().signum() < 0
                || request.getMarksAwarded().compareTo(question.getMarks()) > 0) {
            throw error("Awarded marks must be between zero and the question's maximum marks.",
                    HttpStatus.BAD_REQUEST, "ASSESSMENT_INVALID_AWARDED_MARKS");
        }
        Instant now = Instant.now();
        AssessmentAnswer answer = answers.findByAttemptIdAndQuestionId(attemptId, questionId)
                .orElseGet(() -> AssessmentAnswer.builder().attempt(attempt).question(question)
                        .createdAt(now).build());
        BigDecimal previousMarks = answer.getMarksAwarded();
        String previousFeedback = answer.getFeedback();
        String updatedFeedback = request.getFeedback() == null ? null : request.getFeedback().trim();
        boolean evaluationChanged = previousMarks == null
                || previousMarks.compareTo(request.getMarksAwarded()) != 0
                || !Objects.equals(previousFeedback, updatedFeedback);

        answer.setMarksAwarded(request.getMarksAwarded());
        answer.setFeedback(updatedFeedback);
        answer.setEvaluatedBy(currentUser());
        answer.setEvaluatedAt(now);
        answer.setUpdatedAt(now);
        answers.save(answer);
        recalculateScore(attempt);
        attempt.setUpdatedAt(now);
        attempts.save(attempt);

        if (evaluationChanged) {
            assessment.setResultsRevision(assessment.getResultsRevision() + 1);
            assessment.setUpdatedAt(now);
            assessments.save(assessment);
        }

        return toResponse(attempt);
    }

    public void publishResults(Long assessmentId) {
        Assessment assessment = ownedAssessment(assessmentId);
        List<AssessmentAttempt> allAttempts = attempts.findByAssessment(assessment);
        if (allAttempts.stream().anyMatch(a -> a.getStatus() == AssessmentAttemptStatus.IN_PROGRESS)) {
            throw error("Results cannot be published while students still have active attempts.",
                    HttpStatus.CONFLICT, "ASSESSMENT_ATTEMPTS_IN_PROGRESS");
        }
        for (AssessmentAttempt attempt : allAttempts) {
            if (!toResponse(attempt).isEvaluationComplete()) {
                throw error("Complete all manual evaluations before publishing results.",
                        HttpStatus.CONFLICT, "ASSESSMENT_EVALUATION_PENDING");
            }
        }
        if (assessment.isResultsPublished()
                && assessment.getPublishedResultsRevision() == assessment.getResultsRevision()) {
            return;
        }

        boolean republishing = assessment.isResultsPublished();
        allAttempts.forEach(attempt -> attempt.setPublishedScore(attempt.getScore()));
        if (!allAttempts.isEmpty()) {
            attempts.saveAll(allAttempts);
        }

        assessment.setResultsPublished(true);
        assessment.setPublishedResultsRevision(assessment.getResultsRevision());
        assessment.setUpdatedAt(Instant.now());
        assessments.save(assessment);

        List<User> recipients = allAttempts.stream()
                .map(AssessmentAttempt::getStudent)
                .filter(Objects::nonNull)
                .filter(student -> student.getId() != null)
                .toList();

        if (!recipients.isEmpty()) {
            String title = republishing ? "Assessment results updated" : "Assessment results published";
            String message = "Results for " + assessment.getTitle() + " ("
                    + assessment.getSubject().getName() + ") have been "
                    + (republishing ? "updated and republished" : "published")
                    + ". Open Quiz & Exams to view your result.";

            // Snapshot each student's own published result for their email only.
            // The outbox stores this data at publication time, so later edits cannot
            // silently change the content of an already queued email.
            Map<Long, Map<String, Object>> recipientEmailData = new LinkedHashMap<>();
            for (AssessmentAttempt attempt : allAttempts) {
                User student = attempt.getStudent();
                if (student == null || student.getId() == null) continue;

                Map<String, Object> resultData = new LinkedHashMap<>();
                resultData.put("assessmentTitle", assessment.getTitle());
                resultData.put("subjectName", assessment.getSubject().getName());
                BigDecimal publishedScore = attempt.getPublishedScore();
                BigDecimal totalMarks = assessment.getTotalMarks();
                if (publishedScore != null) {
                    resultData.put("resultScore", publishedScore);
                }
                if (totalMarks != null && totalMarks.signum() > 0) {
                    resultData.put("resultTotalMarks", totalMarks);
                    if (publishedScore != null) {
                        BigDecimal percentage = publishedScore.multiply(BigDecimal.valueOf(100))
                                .divide(totalMarks, 2, java.math.RoundingMode.HALF_UP);
                        resultData.put("resultPercentage", percentage);
                    }
                }
                recipientEmailData.put(student.getId(), resultData);
            }

            notificationService.createForUsers(
                    recipients,
                    new NotificationCommand(
                            "RESULT",
                            assessment.getId(),
                            title,
                            message,
                            "RESULTS",
                            "NORMAL",
                            "/my-assessments",
                            "RESULT:ASSESSMENT:" + assessment.getId()
                                    + ":REVISION:" + assessment.getResultsRevision(),
                            true,
                            recipientEmailData
                    )
            );
        }
    }

    private void recalculateScore(AssessmentAttempt attempt) {
        BigDecimal score = answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId()).stream()
                .map(AssessmentAnswer::getMarksAwarded).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        attempt.setScore(score);
    }

    private FacultyEvaluationAttemptResponse toResponse(AssessmentAttempt attempt) {
        List<AssessmentQuestion> allQuestions = questions.findByAssessmentIdOrderByPositionAsc(attempt.getAssessment().getId());
        Map<Long, AssessmentAnswer> byQuestion = answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId())
                .stream().collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity()));
        List<FacultyEvaluationAnswerResponse> responseAnswers = allQuestions.stream().map(q -> {
            AssessmentAnswer a = byQuestion.get(q.getId());
            boolean manual = q.getQuestionType() == AssessmentQuestionType.SHORT_ANSWER
                    || q.getQuestionType() == AssessmentQuestionType.DESCRIPTIVE;
            return FacultyEvaluationAnswerResponse.builder().questionId(q.getId())
                    .questionText(q.getQuestionText()).questionType(q.getQuestionType())
                    .options(q.getOptions()).correctAnswer(q.getCorrectAnswer())
                    .submittedAnswer(a == null ? null : a.getAnswer()).maximumMarks(q.getMarks())
                    .marksAwarded(a == null ? null : a.getMarksAwarded())
                    .feedback(a == null ? null : a.getFeedback()).manualEvaluation(manual)
                    .attachmentName(a == null ? null : a.getAttachmentName())
                    .hasAttachment(a != null && a.getAttachmentPath() != null).build();
        }).toList();
        boolean complete = responseAnswers.stream().filter(FacultyEvaluationAnswerResponse::isManualEvaluation)
                .allMatch(a -> a.getSubmittedAnswer() == null || a.getMarksAwarded() != null);
        return FacultyEvaluationAttemptResponse.builder().attemptId(attempt.getId())
                .assessmentId(attempt.getAssessment().getId()).assessmentTitle(attempt.getAssessment().getTitle())
                .studentName(attempt.getStudent().getFullName()).studentUsername(attempt.getStudent().getUsername())
                .status(attempt.getStatus()).startedAt(attempt.getStartedAt()).submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore()).totalMarks(attempt.getAssessment().getTotalMarks())
                .evaluationComplete(complete).answers(responseAnswers).build();
    }

    private Assessment ownedAssessment(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean admin = auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        if (admin) {
            return assessments.findById(id)
                    .orElseThrow(() -> error("Assessment not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
        }
        return assessments.findByIdAndFaculty(id, currentUser())
                .orElseThrow(() -> error("Assessment not found or you do not own it.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        return users.findByUsername(auth.getName())
                .orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
    }

    private APIException error(String message, HttpStatus status, String code) {
        return new APIException(message, status, code);
    }
}
