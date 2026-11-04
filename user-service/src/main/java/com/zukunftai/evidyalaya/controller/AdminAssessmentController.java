package com.zukunftai.evidyalaya.controller;
import com.zukunftai.evidyalaya.model.AdminAssessmentOverviewResponse;
import com.zukunftai.evidyalaya.model.AssessmentParticipationReportResponse;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import com.zukunftai.evidyalaya.service.AssessmentService;
import com.zukunftai.evidyalaya.service.impl.FacultyAssessmentEvaluationService;
import com.zukunftai.evidyalaya.model.FacultyAnswerEvaluationRequest;
import com.zukunftai.evidyalaya.model.FacultyEvaluationAttemptResponse;
import com.zukunftai.evidyalaya.service.impl.AdminAssessmentOverviewService;
import com.zukunftai.evidyalaya.service.importer.QuestionPaperImportService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/assessments/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAssessmentController {
 private final AdminAssessmentOverviewService service;
 private final AssessmentService assessmentService;
 private final FacultyAssessmentEvaluationService evaluationService;
 private final QuestionPaperImportService questionPaperImportService;
 @GetMapping public List<AdminAssessmentOverviewResponse.Item> list(){return service.list();}
 @GetMapping("/{id}") public AdminAssessmentOverviewResponse.Detail detail(@PathVariable Long id){return service.detail(id);}
 @GetMapping("/{id}/report") public AssessmentParticipationReportResponse report(@PathVariable Long id){return assessmentService.getParticipationReportForAdmin(id);}
 @PostMapping("/faculty/{facultyId}/drafts")
 public ResponseEntity<Long> createForFaculty(@PathVariable Long facultyId, @Valid @RequestBody AssessmentRequest request) {
  return ResponseEntity.status(201).body(assessmentService.createDraftForFaculty(facultyId, request).getId());
 }
 @PostMapping(path = "/question-paper/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
 public QuestionPaperImportService.ImportResult previewQuestionPaper(@RequestParam("file") MultipartFile file) {
  return questionPaperImportService.preview(file);
 }
 @PostMapping(path = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
 public ResponseEntity<?> uploadAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
  return ResponseEntity.ok(assessmentService.uploadAttachmentForAdmin(id, file).getId());
 }
 @GetMapping("/{id}/evaluations")
 public List<FacultyEvaluationAttemptResponse> submissions(@PathVariable Long id) {
  return evaluationService.listAttempts(id);
 }
 @GetMapping("/{id}/evaluations/{attemptId}")
 public FacultyEvaluationAttemptResponse submission(@PathVariable Long id, @PathVariable Long attemptId) {
  return evaluationService.getAttempt(id, attemptId);
 }
 @PutMapping("/{id}/evaluations/{attemptId}/answers/{questionId}")
 public FacultyEvaluationAttemptResponse evaluate(@PathVariable Long id, @PathVariable Long attemptId,
   @PathVariable Long questionId, @Valid @RequestBody FacultyAnswerEvaluationRequest request) {
  return evaluationService.evaluateAnswer(id, attemptId, questionId, request);
 }
 @PostMapping("/{id}/publish-results")
 public ResponseEntity<Void> publishResults(@PathVariable Long id) {
  evaluationService.publishResults(id);
  return ResponseEntity.noContent().build();
 }
 @PostMapping("/{id}/publish")
 public ResponseEntity<Void> publishForFaculty(@PathVariable Long id) {
  assessmentService.publishForAdmin(id);
  return ResponseEntity.noContent().build();
 }
}
