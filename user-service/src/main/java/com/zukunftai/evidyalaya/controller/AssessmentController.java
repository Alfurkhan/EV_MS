package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.database.AssessmentQuestion;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.AssessmentQuestionRepository;
import com.zukunftai.evidyalaya.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping(path = "/assessments", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AssessmentController {
    private final AssessmentService assessmentService;
    private final AssessmentQuestionRepository questionRepository;

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public List<AssessmentResponse> facultyAssessments() {
        return assessmentService.getFacultyAssessments().stream().map(this::toResponse).toList();
    }

    @GetMapping("/faculty/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public AssessmentResponse facultyAssessment(@PathVariable Long id) {
        return toResponse(assessmentService.getFacultyAssessment(id));
    }

    @PostMapping("/faculty/drafts")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<AssessmentResponse> createDraft(@Valid @RequestBody AssessmentRequest request) {
        return ResponseEntity.status(201).body(toResponse(assessmentService.createDraft(request)));
    }

    @PutMapping("/faculty/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public AssessmentResponse updateDraft(@PathVariable Long id, @Valid @RequestBody AssessmentRequest request) {
        return toResponse(assessmentService.updateDraft(id, request));
    }

    @PostMapping("/faculty/{id}/publish")
    @PreAuthorize("hasRole('FACULTY')")
    public AssessmentResponse publish(@PathVariable Long id) {
        return toResponse(assessmentService.publish(id));
    }


    @PostMapping(path = "/faculty/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FACULTY')")
    public AssessmentResponse uploadAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return toResponse(assessmentService.uploadAttachment(id, file));
    }

    @GetMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws IOException {
        Assessment assessment = assessmentService.getAssessmentForAttachment(id);
        if (assessment.getAttachmentPath() == null) return ResponseEntity.notFound().build();
        Path path = assessmentService.resolveStoredAttachment(assessment.getAttachmentPath());
        Resource resource = new UrlResource(path.toUri());
        String name = assessment.getAttachmentName() == null ? "assessment-attachment" : assessment.getAttachmentName().replace("\\r", "").replace("\\n", "");
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        if (assessment.getAttachmentContentType() != null) {
            try { contentType = MediaType.parseMediaType(assessment.getAttachmentContentType()); }
            catch (IllegalArgumentException ignored) { /* retain safe binary fallback */ }
        }
        return ResponseEntity.ok().contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name, StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    private AssessmentResponse toResponse(Assessment assessment) {
        List<AssessmentQuestionResponse> questions = questionRepository
                .findByAssessmentIdOrderByPositionAsc(assessment.getId()).stream()
                .map(this::toQuestionResponse).toList();
        return AssessmentResponse.builder()
                .id(assessment.getId()).title(assessment.getTitle()).description(assessment.getDescription())
                .assessmentType(assessment.getAssessmentType()).status(assessment.getStatus())
                .academicYearId(assessment.getAcademicYear().getId()).academicYearName(assessment.getAcademicYear().getName())
                .gradeId(assessment.getGrade().getId()).gradeName(assessment.getGrade().getName())
                .sectionId(assessment.getSection().getId()).sectionName(assessment.getSection().getName())
                .subjectId(assessment.getSubject().getId()).subjectName(assessment.getSubject().getName())
                .subjectCode(assessment.getSubject().getCode())
                .facultyId(assessment.getFaculty().getId()).facultyName(assessment.getFaculty().getFullName())
                .timingMode(assessment.getTimingMode()).availableFrom(assessment.getAvailableFrom())
                .availableUntil(assessment.getAvailableUntil()).durationMinutes(assessment.getDurationMinutes())
                .allowOvertime(assessment.isAllowOvertime()).totalMarks(assessment.getTotalMarks())
                .publishedAt(assessment.getPublishedAt()).resultsPublished(assessment.isResultsPublished()).createdAt(assessment.getCreatedAt())
                .updatedAt(assessment.getUpdatedAt()).questions(questions)
                .hasAttachment(assessment.getAttachmentPath() != null).attachmentName(assessment.getAttachmentName())
                .attachmentSize(assessment.getAttachmentSize()).build();
    }

    private AssessmentQuestionResponse toQuestionResponse(AssessmentQuestion question) {
        return AssessmentQuestionResponse.builder()
                .id(question.getId()).questionText(question.getQuestionText())
                .questionType(question.getQuestionType()).options(question.getOptions())
                .correctAnswer(question.getCorrectAnswer()).marks(question.getMarks())
                .position(question.getPosition()).build();
    }
}