package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.AssignmentGradeRequest;
import com.zukunftai.evidyalaya.model.AssignmentRequest;
import com.zukunftai.evidyalaya.model.AssignmentSubmissionRequest;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.AssignmentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@Transactional
public class AssignmentServiceImpl implements AssignmentService {
    private static final long MAX_ATTACHMENT_BYTES = 25L * 1024 * 1024;

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final TimetableRepository timetableRepository;

    @Value("${app.assignment-storage-dir:uploads/assignments}")
    private String storageDirectory;

    @Value("${app.assignment-time-zone:Asia/Kolkata}")
    private String assignmentTimeZone;

    public AssignmentServiceImpl(
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository submissionRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            StudentEnrollmentRepository enrollmentRepository,
            TimetableRepository timetableRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.timetableRepository = timetableRepository;
    }

    @Override
    public Assignment createDraft(AssignmentRequest request) {
        User faculty = currentUser();
        AcademicYear year = findOrThrow(academicYearRepository.findById(request.getAcademicYearId()).orElse(null), "Academic year not found.");
        Grade grade = findOrThrow(gradeRepository.findById(request.getGradeId()).orElse(null), "Grade not found.");
        Section section = findOrThrow(sectionRepository.findById(request.getSectionId()).orElse(null), "Section not found.");
        Subject subject = findOrThrow(subjectRepository.findById(request.getSubjectId()).orElse(null), "Subject not found.");
        validateTeachingAssignment(faculty, year, grade, section, subject);
        validateDueDate(request.getDueAt());
        Instant now = Instant.now();
        return assignmentRepository.save(Assignment.builder()
                .title(request.getTitle().trim())
                .instructions(request.getInstructions().trim())
                .academicYear(year).grade(grade).section(section).subject(subject).faculty(faculty)
                .dueAt(request.getDueAt()).status(AssignmentStatus.DRAFT)
                .createdAt(now).updatedAt(now).build());
    }

    @Override
    public Assignment updateDraft(Long id, AssignmentRequest request) {
        User faculty = currentUser();
        Assignment assignment = findFacultyAssignment(id, faculty);
        if (assignment.getStatus() != AssignmentStatus.DRAFT) {
            throw error("Only draft assignments can be edited.", HttpStatus.CONFLICT, "ASSIGNMENT_NOT_DRAFT");
        }
        AcademicYear year = findOrThrow(academicYearRepository.findById(request.getAcademicYearId()).orElse(null), "Academic year not found.");
        Grade grade = findOrThrow(gradeRepository.findById(request.getGradeId()).orElse(null), "Grade not found.");
        Section section = findOrThrow(sectionRepository.findById(request.getSectionId()).orElse(null), "Section not found.");
        Subject subject = findOrThrow(subjectRepository.findById(request.getSubjectId()).orElse(null), "Subject not found.");
        validateTeachingAssignment(faculty, year, grade, section, subject);
        validateDueDate(request.getDueAt());
        assignment.setTitle(request.getTitle().trim());
        assignment.setInstructions(request.getInstructions().trim());
        assignment.setAcademicYear(year);
        assignment.setGrade(grade);
        assignment.setSection(section);
        assignment.setSubject(subject);
        assignment.setDueAt(request.getDueAt());
        assignment.setUpdatedAt(Instant.now());
        return assignmentRepository.save(assignment);
    }

    @Override
    public Assignment publish(Long id) {
        Assignment assignment = findFacultyAssignment(id, currentUser());
        if (assignment.getStatus() != AssignmentStatus.DRAFT) {
            throw error("Only draft assignments can be published.", HttpStatus.CONFLICT, "ASSIGNMENT_NOT_DRAFT");
        }
        if (assignment.getDueAt() == null) {
            throw error("A due date is required before publishing.", HttpStatus.BAD_REQUEST, "ASSIGNMENT_DUE_DATE_REQUIRED");
        }
        assignment.setStatus(AssignmentStatus.PUBLISHED);
        assignment.setUpdatedAt(Instant.now());
        return assignmentRepository.save(assignment);
    }

    @Override
    public void deleteAssignment(Long id) {
        Assignment assignment = findFacultyAssignment(id, currentUser());
        submissionRepository.findByAssignmentOrderBySubmittedAtDesc(assignment)
                .forEach(submission -> deleteStoredFile(submission.getAttachmentPath()));
        deleteStoredFile(assignment.getAttachmentPath());
        assignmentRepository.delete(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Assignment> getFacultyAssignments() {
        return assignmentRepository.findByFacultyOrderByCreatedAtDesc(currentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Assignment> getStudentAssignments() {
        User student = currentUser();
        Map<Long, Assignment> unique = new LinkedHashMap<>();
        for (StudentEnrollment enrollment : enrollmentRepository.findByStudentAndActiveTrue(student)) {
            assignmentRepository.findByAcademicYearAndGradeAndSectionAndStatusOrderByDueAtAsc(
                    enrollment.getAcademicYear(), enrollment.getGrade(), enrollment.getSection(), AssignmentStatus.PUBLISHED)
                    .forEach(assignment -> unique.put(assignment.getId(), assignment));
        }
        return new ArrayList<>(unique.values());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Assignment> getAdminAssignments() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public AssignmentSubmission submit(Long assignmentId, String responseText, MultipartFile file) {
        User student = currentUser();
        Assignment assignment = findOrThrow(assignmentRepository.findById(assignmentId).orElse(null), "Assignment not found.");
        validateStudentCanAccess(student, assignment);
        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw error("This assignment is not published.", HttpStatus.CONFLICT, "ASSIGNMENT_NOT_PUBLISHED");
        }
        if ((responseText == null || responseText.isBlank()) && (file == null || file.isEmpty())) {
            throw error("Write a response or attach a file before submitting.", HttpStatus.BAD_REQUEST, "ASSIGNMENT_SUBMISSION_EMPTY");
        }
        if (responseText != null && responseText.length() > 20000) {
            throw error("Written responses must be 20,000 characters or fewer.", HttpStatus.BAD_REQUEST, "ASSIGNMENT_RESPONSE_TOO_LONG");
        }
        AssignmentSubmission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElseGet(() -> AssignmentSubmission.builder().assignment(assignment).student(student)
                        .createdAt(Instant.now()).build());
        if (submission.getSubmittedAt() != null && LocalDateTime.now(assignmentZone()).isAfter(assignment.getDueAt())) {
            throw error("Resubmissions are closed after the due date.", HttpStatus.CONFLICT, "ASSIGNMENT_RESUBMISSION_CLOSED");
        }
        submission.setResponseText(responseText == null ? "" : responseText.trim());
        if (file != null && !file.isEmpty()) {
            StoredFile stored = storeFile(file);
            deleteStoredFile(submission.getAttachmentPath());
            submission.setAttachmentPath(stored.path());
            submission.setAttachmentName(stored.name());
            submission.setAttachmentContentType(stored.contentType());
            submission.setAttachmentSize(stored.size());
        }
        submission.setSubmittedAt(Instant.now());
        submission.setUpdatedAt(Instant.now());
        submission.setMarks(null);
        submission.setMaxMarks(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);
        return submissionRepository.save(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getStudentSubmissions() {
        return submissionRepository.findByStudentOrderByUpdatedAtDesc(currentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getSubmissionsForFaculty(Long assignmentId) {
        Assignment assignment = findFacultyAssignment(assignmentId, currentUser());
        return submissionRepository.findByAssignmentOrderBySubmittedAtDesc(assignment);
    }

    @Override
    public AssignmentSubmission gradeSubmission(Long submissionId, AssignmentGradeRequest request) {
        AssignmentSubmission submission = findOrThrow(submissionRepository.findById(submissionId).orElse(null), "Submission not found.");
        Assignment assignment = findFacultyAssignment(submission.getAssignment().getId(), currentUser());
        BigDecimal marks = request.getMarks();
        BigDecimal maxMarks = request.getMaxMarks();
        if (marks.compareTo(maxMarks) > 0) {
            throw error("Marks cannot exceed the maximum marks.", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNMENT_MARKS");
        }
        submission.setMarks(marks);
        submission.setMaxMarks(maxMarks);
        submission.setFeedback(request.getFeedback() == null ? null : request.getFeedback().trim());
        submission.setGradedAt(Instant.now());
        submission.setUpdatedAt(Instant.now());
        return submissionRepository.save(submission);
    }

    @Override
    public Assignment uploadAssignmentAttachment(Long assignmentId, MultipartFile file) {
        Assignment assignment = findFacultyAssignment(assignmentId, currentUser());
        if (assignment.getStatus() != AssignmentStatus.DRAFT) {
            throw error("Attachments can only be changed while an assignment is a draft.", HttpStatus.CONFLICT, "ASSIGNMENT_NOT_DRAFT");
        }
        StoredFile stored = storeFile(file);
        deleteStoredFile(assignment.getAttachmentPath());
        assignment.setAttachmentPath(stored.path());
        assignment.setAttachmentName(stored.name());
        assignment.setAttachmentContentType(stored.contentType());
        assignment.setAttachmentSize(stored.size());
        assignment.setUpdatedAt(Instant.now());
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public Assignment getAssignmentForAttachment(Long assignmentId) {
        Assignment assignment = findOrThrow(assignmentRepository.findById(assignmentId).orElse(null), "Assignment not found.");
        User user = currentUser();
        if (isAdmin() || (assignment.getFaculty().getId().equals(user.getId()))) return assignment;
        validateStudentCanAccess(user, assignment);
        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw error("This assignment is not published.", HttpStatus.FORBIDDEN, "ASSIGNMENT_NOT_ACCESSIBLE");
        }
        return assignment;
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentSubmission getSubmissionForAttachment(Long submissionId) {
        AssignmentSubmission submission = findOrThrow(submissionRepository.findById(submissionId).orElse(null), "Submission not found.");
        User user = currentUser();
        if (isAdmin() || submission.getStudent().getId().equals(user.getId())
                || submission.getAssignment().getFaculty().getId().equals(user.getId())) return submission;
        throw error("You are not allowed to view this submission attachment.", HttpStatus.FORBIDDEN, "SUBMISSION_NOT_ACCESSIBLE");
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

    private void validateTeachingAssignment(User faculty, AcademicYear year, Grade grade, Section section, Subject subject) {
        if (!grade.getAcademicYear().getId().equals(year.getId())
                || !section.getGrade().getId().equals(grade.getId())
                || !grade.getSubjects().stream().anyMatch(s -> s.getId().equals(subject.getId()))) {
            throw error("The selected academic year, grade, section and subject do not match.", HttpStatus.BAD_REQUEST, "ASSIGNMENT_ACADEMIC_MISMATCH");
        }
        boolean assigned = timetableRepository.findByAcademicYearAndGradeAndSectionAndActiveTrueAndStatus(
                year, grade, section, TimetableStatus.APPROVED).stream()
                .anyMatch(t -> t.getSubject().getId().equals(subject.getId())
                        && t.getFaculty().getId().equals(faculty.getId()));
        if (!assigned) {
            throw error("You can only create assignments for subjects and classes assigned to you in an approved timetable.", HttpStatus.FORBIDDEN, "ASSIGNMENT_TEACHING_NOT_AUTHORIZED");
        }
    }

    private void validateStudentCanAccess(User student, Assignment assignment) {
        boolean enrolled = enrollmentRepository.findByStudentAndActiveTrue(student).stream()
                .anyMatch(e -> e.getAcademicYear().getId().equals(assignment.getAcademicYear().getId())
                        && e.getGrade().getId().equals(assignment.getGrade().getId())
                        && e.getSection().getId().equals(assignment.getSection().getId()));
        if (!enrolled) {
            throw error("You are not enrolled in the class for this assignment.", HttpStatus.FORBIDDEN, "ASSIGNMENT_STUDENT_NOT_ENROLLED");
        }
    }

    private Assignment findFacultyAssignment(Long id, User faculty) {
        return assignmentRepository.findByIdAndFaculty(id, faculty)
                .orElseThrow(() -> error("Assignment not found or you do not own it.", HttpStatus.NOT_FOUND, "ASSIGNMENT_NOT_FOUND"));
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLate(AssignmentSubmission submission) {
        return submission.getSubmittedAt() != null && submission.getSubmittedAt()
                .isAfter(submission.getAssignment().getDueAt().atZone(assignmentZone()).toInstant());
    }

    private ZoneId assignmentZone() {
        return ZoneId.of(assignmentTimeZone);
    }

    private void validateDueDate(LocalDateTime dueAt) {
        if (dueAt == null) throw error("Due date and time are required.", HttpStatus.BAD_REQUEST, "ASSIGNMENT_DUE_DATE_REQUIRED");
    }

    private <T> T findOrThrow(T value, String message) {
        if (value == null) throw error(message, HttpStatus.NOT_FOUND, "ASSIGNMENT_REFERENCE_NOT_FOUND");
        return value;
    }

    private APIException error(String message, HttpStatus status, String code) {
        return new APIException(message, status, code);
    }

    private StoredFile storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw error("Choose a non-empty attachment.", HttpStatus.BAD_REQUEST, "ATTACHMENT_REQUIRED");
        }
        if (file.getSize() > MAX_ATTACHMENT_BYTES) {
            throw error("Attachments must be 25 MB or smaller.", HttpStatus.PAYLOAD_TOO_LARGE, "ATTACHMENT_TOO_LARGE");
        }
        String original = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "attachment"));
        if (original.isBlank() || original.contains("..")) {
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
        try {
            Files.deleteIfExists(resolveStoredAttachment(storedPath));
        } catch (Exception ignored) {
            // Keep database changes independent from best-effort cleanup of old files.
        }
    }

    private record StoredFile(String path, String name, String contentType, long size) {}
}
