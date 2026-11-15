package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Assignment;
import com.zukunftai.evidyalaya.database.AssignmentSubmission;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.AssignmentSubmissionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.*;


@RestController
@RequestMapping(path = "/assignments", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AssignmentController {
    private final AssignmentService assignmentService;
    private final AssignmentSubmissionRepository submissionRepository;
    private final StudentEnrollmentRepository enrollmentRepository;

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public List<AssignmentResponse> facultyAssignments() {
        return assignmentService.getFacultyAssignments().stream().map(this::toAssignmentResponse).toList();
    }

    @PostMapping("/faculty/drafts")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<AssignmentResponse> createDraft(@Valid @RequestBody AssignmentRequest request) {
        return ResponseEntity.status(201).body(toAssignmentResponse(assignmentService.createDraft(request)));
    }

    @PutMapping("/faculty/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public AssignmentResponse updateDraft(@PathVariable Long id, @Valid @RequestBody AssignmentRequest request) {
        return toAssignmentResponse(assignmentService.updateDraft(id, request));
    }

    @PutMapping("/faculty/{id}/publish")
    @PreAuthorize("hasRole('FACULTY')")
    public AssignmentResponse publish(@PathVariable Long id) {
        return toAssignmentResponse(assignmentService.publish(id));
    }

    @DeleteMapping("/faculty/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/faculty/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FACULTY')")
    public AssignmentResponse uploadAssignmentAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return toAssignmentResponse(assignmentService.uploadAssignmentAttachment(id, file));
    }

    @GetMapping("/faculty/{id}/submissions")
    @PreAuthorize("hasRole('FACULTY')")
    public List<AssignmentSubmissionResponse> facultySubmissions(@PathVariable Long id) {
        return assignmentService.getSubmissionsForFaculty(id).stream().map(this::toSubmissionResponse).toList();
    }

    @GetMapping("/faculty/{id}/report")
    @PreAuthorize("hasRole('FACULTY')")
    public Map<String, Object> assignmentReport(@PathVariable Long id) {
        Assignment assignment = assignmentService.getFacultyAssignments().stream()
                .filter(item -> item.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found."));

        Map<Long, AssignmentSubmission> submittedByStudent = new HashMap<>();
        for (AssignmentSubmission submission : assignmentService.getSubmissionsForFaculty(id)) {
            if (submission.getSubmittedAt() != null) {
                submittedByStudent.put(submission.getStudent().getId(), submission);
            }
        }

        List<Map<String, Object>> students = enrollmentRepository
                .findByAcademicYearAndGradeAndSectionAndActiveTrue(
                        assignment.getAcademicYear(), assignment.getGrade(), assignment.getSection())
                .stream()
                .sorted(Comparator.comparing(enrollment ->
                        Optional.ofNullable(enrollment.getStudent().getFullName()).orElse("").toLowerCase(Locale.ROOT)))
                .map(enrollment -> {
                    var student = enrollment.getStudent();
                    AssignmentSubmission submission = submittedByStudent.get(student.getId());
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId", student.getId());
                    row.put("studentName", student.getFullName());
                    row.put("studentEmail", student.getEmail());
                    row.put("submitted", submission != null);
                    row.put("submittedAt", submission == null ? null : submission.getSubmittedAt());
                    row.put("graded", submission != null && submission.getGradedAt() != null);
                    return row;
                })
                .toList();

        long totalStudents = students.size();
        long submittedCount = students.stream().filter(student -> Boolean.TRUE.equals(student.get("submitted"))).count();
        long pendingCount = totalStudents - submittedCount;
        long submissionRate = totalStudents == 0 ? 0L : Math.round(submittedCount * 100.0 / totalStudents);
        return Map.of(
                "totalStudents", totalStudents,
                "submittedCount", submittedCount,
                "pendingCount", pendingCount,
                "submissionRate", submissionRate,
                "students", students
        );
    }

    @PutMapping("/faculty/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('FACULTY')")
    public AssignmentSubmissionResponse grade(@PathVariable Long submissionId, @Valid @RequestBody AssignmentGradeRequest request) {
        return toSubmissionResponse(assignmentService.gradeSubmission(submissionId, request));
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AssignmentResponse> studentAssignments() {
        return assignmentService.getStudentAssignments().stream().map(this::toAssignmentResponse).toList();
    }

    @GetMapping("/student/submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AssignmentSubmissionResponse> studentSubmissions() {
        return assignmentService.getStudentSubmissions().stream().map(this::toSubmissionResponse).toList();
    }

    @PostMapping(path = "/student/{assignmentId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public AssignmentSubmissionResponse submit(
            @PathVariable Long assignmentId,
            @RequestParam(value = "responseText", required = false) String responseText,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return toSubmissionResponse(assignmentService.submit(assignmentId, responseText, file));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AssignmentResponse> adminAssignments() {
        return assignmentService.getAdminAssignments().stream().map(this::toAssignmentResponse).toList();
    }

    @GetMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
    public ResponseEntity<Resource> assignmentAttachment(@PathVariable Long id) throws IOException {
        Assignment assignment = assignmentService.getAssignmentForAttachment(id);
        if (assignment.getAttachmentPath() == null) return ResponseEntity.notFound().build();
        return fileResponse(assignmentService.resolveStoredAttachment(assignment.getAttachmentPath()),
                assignment.getAttachmentName(), assignment.getAttachmentContentType());
    }

    @GetMapping("/submissions/{id}/attachment")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
    public ResponseEntity<Resource> submissionAttachment(@PathVariable Long id) throws IOException {
        AssignmentSubmission submission = assignmentService.getSubmissionForAttachment(id);
        if (submission.getAttachmentPath() == null) return ResponseEntity.notFound().build();
        return fileResponse(assignmentService.resolveStoredAttachment(submission.getAttachmentPath()),
                submission.getAttachmentName(), submission.getAttachmentContentType());
    }

    private ResponseEntity<Resource> fileResponse(Path path, String filename, String contentType) throws IOException {
        Resource resource = new UrlResource(path.toUri());
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (contentType != null) {
            try { mediaType = MediaType.parseMediaType(contentType); } catch (Exception ignored) { }
        }
        String safeName = filename == null || filename.isBlank() ? "attachment" : filename.replace("\r", "").replace("\n", "");
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(safeName, StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    private AssignmentResponse toAssignmentResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .instructions(assignment.getInstructions())
                .academicYearId(assignment.getAcademicYear().getId())
                .academicYearName(assignment.getAcademicYear().getName())
                .gradeId(assignment.getGrade().getId())
                .gradeName(assignment.getGrade().getName())
                .sectionId(assignment.getSection().getId())
                .sectionName(assignment.getSection().getName())
                .subjectId(assignment.getSubject().getId())
                .subjectName(assignment.getSubject().getName())
                .subjectCode(assignment.getSubject().getCode())
                .facultyId(assignment.getFaculty().getId())
                .facultyName(assignment.getFaculty().getFullName())
                .dueAt(assignment.getDueAt())
                .status(assignment.getStatus())
                .hasAttachment(assignment.getAttachmentPath() != null)
                .attachmentName(assignment.getAttachmentName())
                .submissionCount(submissionRepository.countByAssignment(assignment))
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }

    private AssignmentSubmissionResponse toSubmissionResponse(AssignmentSubmission submission) {
        boolean late = assignmentService.isLate(submission);
        return AssignmentSubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .assignmentTitle(submission.getAssignment().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullName())
                .studentEmail(submission.getStudent().getEmail())
                .responseText(submission.getResponseText())
                .submittedAt(submission.getSubmittedAt())
                .late(late)
                .marks(submission.getMarks())
                .maxMarks(submission.getMaxMarks())
                .feedback(submission.getFeedback())
                .gradedAt(submission.getGradedAt())
                .hasAttachment(submission.getAttachmentPath() != null)
                .attachmentName(submission.getAttachmentName())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }
}
