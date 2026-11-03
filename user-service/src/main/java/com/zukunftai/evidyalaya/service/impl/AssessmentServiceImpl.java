package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.AssessmentQuestionRequest;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import com.zukunftai.evidyalaya.model.AssessmentParticipationReportResponse;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.AssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
    private final StudentEnrollmentRepository enrollmentRepository;
    private final AssessmentAttemptRepository attemptRepository;

    @Value("${app.assessment-storage-dir:uploads/assessments}")
    private String storageDirectory;

    private static final ZoneId ASSESSMENT_ZONE = ZoneId.of("Asia/Kolkata");

    public AssessmentServiceImpl(AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository questionRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            TimetableRepository timetableRepository,
            StudentEnrollmentRepository enrollmentRepository,
            AssessmentAttemptRepository attemptRepository) {
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.timetableRepository = timetableRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attemptRepository = attemptRepository;
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
        assessment.setPublishedAt(LocalDateTime.now(ASSESSMENT_ZONE));
        assessment.setUpdatedAt(Instant.now());
        return assessmentRepository.save(assessment);
    }


    @Override
    public void deleteDraft(Long id) {
        Assessment assessment = findOwned(id);
        if (assessment.getStatus() != AssessmentStatus.DRAFT) {
            throw error("Only your own draft assessments can be permanently deleted.", HttpStatus.CONFLICT, "ASSESSMENT_NOT_DRAFT");
        }
        if (attemptRepository.countByAssessmentId(id) > 0) {
            throw error("This draft has attempt records and cannot be permanently deleted.", HttpStatus.CONFLICT, "ASSESSMENT_HAS_ATTEMPTS");
        }
        questionRepository.deleteByAssessmentId(id);
        assessmentRepository.delete(assessment);
        deleteStoredFile(assessment.getAttachmentPath());
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentParticipationReportResponse getParticipationReport(Long id) {
        Assessment assessment = findOwned(id);
        List<AssessmentAttempt> rows = attemptRepository.findAll().stream()
                .filter(attempt -> attempt.getAssessment().getId().equals(id))
                .toList();
        long total = enrollmentRepository.countByAcademicYearAndGradeAndSectionAndActiveTrue(
                assessment.getAcademicYear(), assessment.getGrade(), assessment.getSection());
        long attempted = rows.stream().map(attempt -> attempt.getStudent().getId()).distinct().count();
        long active = rows.stream().filter(attempt -> attempt.getStatus() == AssessmentAttemptStatus.IN_PROGRESS).count();
        long submitted = rows.size() - active;
        return new AssessmentParticipationReportResponse(total, attempted,
                Math.max(0, total - attempted), active, submitted);
    }

    @Override
    public Assessment uploadAttachment(Long id, MultipartFile file) {
        Assessment assessment = findOwned(id);
        if (assessment.getStatus() != AssessmentStatus.DRAFT) {
            throw error("Attachments can only be changed while an assessment is a draft.", HttpStatus.CONFLICT, "ASSESSMENT_NOT_DRAFT");
        }
        StoredFile stored = storeFile(file);
        deleteStoredFile(assessment.getAttachmentPath());
        assessment.setAttachmentPath(stored.path());
        assessment.setAttachmentName(stored.name());
        assessment.setAttachmentContentType(stored.contentType());
        assessment.setAttachmentSize(stored.size());
        assessment.setUpdatedAt(Instant.now());
        return assessmentRepository.save(assessment);
    }

    @Override
    @Transactional(readOnly = true)
    public Assessment getAssessmentForAttachment(Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> error("Assessment not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        }
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (admin || assessment.getFaculty().getId().equals(user.getId())) return assessment;
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            if (assessment.getStatus() != AssessmentStatus.PUBLISHED) {
                throw error("This assessment is not published.", HttpStatus.FORBIDDEN, "ASSESSMENT_NOT_ACCESSIBLE");
            }
            boolean enrolled = enrollmentRepository.findByStudentAndActiveTrue(user).stream()
                    .anyMatch(e -> e.getAcademicYear().getId().equals(assessment.getAcademicYear().getId())
                            && e.getGrade().getId().equals(assessment.getGrade().getId())
                            && e.getSection().getId().equals(assessment.getSection().getId()));
            if (enrolled) return assessment;
        }
        throw error("You are not allowed to view this assessment attachment.", HttpStatus.FORBIDDEN, "ASSESSMENT_ATTACHMENT_FORBIDDEN");
    }

    @Override
    public Path resolveStoredAttachment(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            throw error("Attachment not found.", HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND");
        }
        Path root = Paths.get(storageDirectory).toAbsolutePath().normalize();
        Path resolved = root.resolve(storedPath).normalize();
        if (!resolved.startsWith(root) || !Files.isRegularFile(resolved)) {
            throw error("Attachment not found.", HttpStatus.NOT_FOUND, "ATTACHMENT_NOT_FOUND");
        }
        return resolved;
    }

    private StoredFile storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw error("Choose a non-empty attachment.", HttpStatus.BAD_REQUEST, "ATTACHMENT_REQUIRED");
        }
        if (file.getSize() > 25L * 1024 * 1024) {
            throw error("Attachments must be 25 MB or smaller.", HttpStatus.PAYLOAD_TOO_LARGE, "ATTACHMENT_TOO_LARGE");
        }
        String original = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "attachment"));
        if (original.isBlank() || original.contains("..") || original.contains("/") || original.contains("\\")) {
            throw error("Invalid attachment filename.", HttpStatus.BAD_REQUEST, "INVALID_ATTACHMENT_NAME");
        }
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && original.length() - dot <= 20) extension = original.substring(dot);
        String generated = UUID.randomUUID() + extension;
        Path root = Paths.get(storageDirectory).toAbsolutePath().normalize();
        Path destination = root.resolve(generated).normalize();
        try {
            Files.createDirectories(root);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw error("Could not store the attachment.", HttpStatus.INTERNAL_SERVER_ERROR, "ATTACHMENT_STORAGE_FAILED");
        }
        String contentType = file.getContentType();
        return new StoredFile(generated, original, contentType == null ? "application/octet-stream" : contentType, file.getSize());
    }

    private void deleteStoredFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) return;
        try { Files.deleteIfExists(resolveStoredAttachment(storedPath)); }
        catch (Exception ignored) { /* best-effort cleanup */ }
    }

    private record StoredFile(String path, String name, String contentType, long size) {}

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
        if (objective) {
            if (options == null || options.size() < 2) {
                throw error("Choice questions require at least two options.", HttpStatus.BAD_REQUEST, "ASSESSMENT_OPTIONS_REQUIRED");
            }
            Set<String> normalizedOptions = new HashSet<>();
            for (String option : options) {
                if (option == null || option.isBlank()
                        || !normalizedOptions.add(option.trim().toLowerCase(Locale.ROOT))) {
                    throw error("Answer options must be non-empty and unique.", HttpStatus.BAD_REQUEST, "ASSESSMENT_OPTIONS_INVALID");
                }
            }
        }
        if (type == AssessmentQuestionType.TRUE_FALSE && options.size() != 2) {
            throw error("True/false questions require exactly two options.", HttpStatus.BAD_REQUEST, "ASSESSMENT_OPTIONS_REQUIRED");
        }
        if (!publishing) return;
        if (objective && (answer == null || answer.isNull() || answer.isMissingNode())) {
            throw error("Objective questions need a correct answer before publishing.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ANSWER_REQUIRED");
        }
        if (publishing && !objective && answer != null && !answer.isNull()) {
            throw error("Short-answer and descriptive questions are graded manually; do not provide an automatic answer key.", HttpStatus.BAD_REQUEST, "ASSESSMENT_MANUAL_ANSWER_KEY_NOT_ALLOWED");
        }
        if (type == AssessmentQuestionType.MCQ || type == AssessmentQuestionType.TRUE_FALSE) {
            if (!isValidOptionIndex(answer, options.size())) {
                throw error("The correct answer must reference an available option.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ANSWER_INVALID");
            }
        } else if (type == AssessmentQuestionType.MULTIPLE_SELECT) {
            if (!answer.isArray() || answer.isEmpty()) {
                throw error("Select at least one correct option for a multiple-select question.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ANSWER_INVALID");
            }
            Set<Integer> selected = new HashSet<>();
            for (com.fasterxml.jackson.databind.JsonNode index : answer) {
                if (!isValidOptionIndex(index, options.size()) || !selected.add(index.intValue())) {
                    throw error("Multiple-select answers must contain unique, available option indexes.", HttpStatus.BAD_REQUEST, "ASSESSMENT_ANSWER_INVALID");
                }
            }
        }
    }

    private boolean isValidOptionIndex(com.fasterxml.jackson.databind.JsonNode value, int optionCount) {
        return value != null && value.isIntegralNumber() && value.canConvertToInt()
                && value.intValue() >= 0 && value.intValue() < optionCount;
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