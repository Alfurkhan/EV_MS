package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.AssessmentQuestionRequest;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.AssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class AssessmentServiceImpl implements AssessmentService {
    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final TimetableRepository timetableRepository;

    public AssessmentServiceImpl(AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository questionRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            TimetableRepository timetableRepository) {
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.timetableRepository = timetableRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Assessment> getFacultyAssessments() {
        return assessmentRepository.findByFacultyOrderByCreatedAtDesc(currentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public Assessment getFacultyAssessment(Long id) {
        Assessment assessment = findOwned(id);
        assessment.getQuestions().size();
        return assessment;
    }

    @Override
    public Assessment createDraft(AssessmentRequest request) {
        User faculty = currentUser();
        References refs = resolveReferences(faculty, request);
        validateSchedule(request);
        Instant now = Instant.now();
        Assessment assessment = Assessment.builder()
                .title(request.getTitle().trim())
                .description(clean(request.getDescription()))
                .assessmentType(request.getAssessmentType())
                .status(AssessmentStatus.DRAFT)
                .academicYear(refs.year()).grade(refs.grade()).section(refs.section())
                .subject(refs.subject()).faculty(faculty)
                .timingMode(request.getTimingMode())
                .availableFrom(request.getAvailableFrom()).availableUntil(request.getAvailableUntil())
                .durationMinutes(request.getTimingMode() == AssessmentTimingMode.INDIVIDUAL_TIMER ? request.getDurationMinutes() : null)
                .allowOvertime(request.isAllowOvertime())
                .totalMarks(request.getTotalMarks())
                .createdAt(now).updatedAt(now).build();
        assessmentRepository.save(assessment);
        replaceQuestions(assessment, request.getQuestions(), false);
        return assessment;
    }

    @Override
    public Assessment updateDraft(Long id, AssessmentRequest request) {
        Assessment assessment = findOwned(id);
        if (assessment.getStatus() != AssessmentStatus.DRAFT) {
            throw error("Only draft assessments can be edited.", HttpStatus.CONFLICT, "ASSESSMENT_NOT_DRAFT");
        }
        References refs = resolveReferences(assessment.getFaculty(), request);
        validateSchedule(request);
        assessment.setTitle(request.getTitle().trim());
        assessment.setDescription(clean(request.getDescription()));
        assessment.setAssessmentType(request.getAssessmentType());
        assessment.setAcademicYear(refs.year());
        assessment.setGrade(refs.grade());
        assessment.setSection(refs.section());
        assessment.setSubject(refs.subject());
        assessment.setTimingMode(request.getTimingMode());
        assessment.setAvailableFrom(request.getAvailableFrom());
        assessment.setAvailableUntil(request.getAvailableUntil());
        assessment.setDurationMinutes(request.getTimingMode() == AssessmentTimingMode.INDIVIDUAL_TIMER ? request.getDurationMinutes() : null);
        assessment.setAllowOvertime(request.isAllowOvertime());
        assessment.setTotalMarks(request.getTotalMarks());
        assessment.setUpdatedAt(Instant.now());
        replaceQuestions(assessment, request.getQuestions(), false);
        return assessmentRepository.save(assessment);
    }

    @Override
    public Assessment publish(Long id) {
        Assessment assessment = findOwned(id);
        if (assessment.getStatus() != AssessmentStatus.DRAFT) {
            throw error("Only draft assessments can be published.", HttpStatus.CONFLICT, "ASSESSMENT_NOT_DRAFT");
        }
        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderByPositionAsc(id);
        if (questions.isEmpty()) {
            throw error("Add at least one question before publishing.", HttpStatus.BAD_REQUEST, "ASSESSMENT_QUESTIONS_REQUIRED");
        }
        BigDecimal marks = questions.stream().map(AssessmentQuestion::getMarks).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (marks.compareTo(assessment.getTotalMarks()) != 0) {
            throw error("The sum of question marks must equal the assessment total marks.", HttpStatus.BAD_REQUEST, "ASSESSMENT_MARKS_MISMATCH");
        }
        for (AssessmentQuestion question : questions) validateQuestion(question.getQuestionType(),
                question.getOptions(), question.getCorrectAnswer(), true);
        assessment.setStatus(AssessmentStatus.PUBLISHED);
        assessment.setPublishedAt(LocalDateTime.now());
        assessment.setUpdatedAt(Instant.now());
        return assessmentRepository.save(assessment);
    }

    private References resolveReferences(User faculty, AssessmentRequest request) {
        AcademicYear year = require(academicYearRepository.findById(request.getAcademicYearId()).orElse(null), "Academic year not found.");
        Grade grade = require(gradeRepository.findById(request.getGradeId()).orElse(null), "Grade not found.");
        Section section = require(sectionRepository.findById(request.getSectionId()).orElse(null), "Section not found.");
        Subject subject = require(subjectRepository.findById(request.getSubjectId()).orElse(null), "Subject not found.");
        if (!grade.getAcademicYear().getId().equals(year.getId())
                || !section.getGrade().getId().equals(grade.getId())
                || !grade.getSubjects().stream().anyMatch(item -> item.getId().equals(subject.getId()))) {
            throw error("The selected academic year, grade, section and subject do not match.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ACADEMIC_MISMATCH");
        }
        boolean assigned = timetableRepository.findByAcademicYearAndGradeAndSectionAndActiveTrueAndStatus(
                year, grade, section, TimetableStatus.APPROVED).stream()
                .anyMatch(item -> item.getSubject().getId().equals(subject.getId())
                        && item.getFaculty().getId().equals(faculty.getId()));
        if (!assigned) {
            throw error("You can only create assessments for subjects and classes assigned to you in an approved timetable.",
                    HttpStatus.FORBIDDEN, "ASSESSMENT_TEACHING_NOT_AUTHORIZED");
        }
        return new References(year, grade, section, subject);
    }

    private void validateSchedule(AssessmentRequest request) {
        if (!request.getAvailableUntil().isAfter(request.getAvailableFrom())) {
            throw error("The closing time must be after the opening time.", HttpStatus.BAD_REQUEST, "ASSESSMENT_INVALID_WINDOW");
        }
        if (request.getTimingMode() == AssessmentTimingMode.INDIVIDUAL_TIMER
                && (request.getDurationMinutes() == null || request.getDurationMinutes() < 1)) {
            throw error("Individual timer assessments require a positive duration in minutes.", HttpStatus.BAD_REQUEST, "ASSESSMENT_DURATION_REQUIRED");
        }
        if (request.getTimingMode() == AssessmentTimingMode.FIXED_WINDOW && request.getDurationMinutes() != null) {
            throw error("Fixed-window assessments do not use an individual duration.", HttpStatus.BAD_REQUEST, "ASSESSMENT_DURATION_NOT_ALLOWED");
        }
    }

    private void replaceQuestions(Assessment assessment, List<AssessmentQuestionRequest> requests, boolean publishing) {
        questionRepository.deleteByAssessmentId(assessment.getId());
        if (requests == null) return;
        Set<Integer> positions = new HashSet<>();
        for (AssessmentQuestionRequest request : requests) {
            if (!positions.add(request.getPosition())) {
                throw error("Question positions must be unique.", HttpStatus.BAD_REQUEST, "ASSESSMENT_DUPLICATE_QUESTION_POSITION");
            }
            validateQuestion(request.getQuestionType(), request.getOptions(), request.getCorrectAnswer(), publishing);
            questionRepository.save(AssessmentQuestion.builder()
                    .assessment(assessment).questionText(request.getQuestionText().trim())
                    .questionType(request.getQuestionType()).options(request.getOptions())
                    .correctAnswer(request.getCorrectAnswer()).marks(request.getMarks())
                    .position(request.getPosition()).createdAt(Instant.now()).build());
        }
    }

    private void validateQuestion(AssessmentQuestionType type, List<String> options,
            com.fasterxml.jackson.databind.JsonNode answer, boolean publishing) {
        boolean objective = type == AssessmentQuestionType.MCQ
                || type == AssessmentQuestionType.MULTIPLE_SELECT
                || type == AssessmentQuestionType.TRUE_FALSE;
        if (type == AssessmentQuestionType.MCQ || type == AssessmentQuestionType.MULTIPLE_SELECT) {
            if (options == null || options.size() < 2) {
                throw error("Choice questions require at least two options.", HttpStatus.BAD_REQUEST, "ASSESSMENT_OPTIONS_REQUIRED");
            }
        }
        if (type == AssessmentQuestionType.TRUE_FALSE
                && (options == null || options.size() != 2)) {
            throw error("True/false questions require exactly two options.", HttpStatus.BAD_REQUEST, "ASSESSMENT_OPTIONS_REQUIRED");
        }
        if (publishing && objective && (answer == null || answer.isNull() || answer.isMissingNode())) {
            throw error("Objective questions need a correct answer before publishing.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ANSWER_REQUIRED");
        }
        if (publishing && !objective && answer != null && !answer.isNull()) {
            throw error("Short-answer and descriptive questions are graded manually; do not provide an automatic answer key.", HttpStatus.BAD_REQUEST, "ASSESSMENT_MANUAL_ANSWER_KEY_NOT_ALLOWED");
        }
    }

    private Assessment findOwned(Long id) {
        return assessmentRepository.findByIdAndFaculty(id, currentUser())
                .orElseThrow(() -> error("Assessment not found or you do not own it.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
    }

    private <T> T require(T value, String message) {
        if (value == null) throw error(message, HttpStatus.NOT_FOUND, "ASSESSMENT_REFERENCE_NOT_FOUND");
        return value;
    }

    private String clean(String value) { return value == null ? null : value.trim(); }

    private APIException error(String message, HttpStatus status, String code) {
        return new APIException(message, status, code);
    }

    private record References(AcademicYear year, Grade grade, Section section, Subject subject) {}
}