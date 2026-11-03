package com.zukunftai.evidyalaya.controller;
import com.zukunftai.evidyalaya.model.AdminAssessmentOverviewResponse;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import com.zukunftai.evidyalaya.service.AssessmentService;
import com.zukunftai.evidyalaya.service.impl.FacultyAssessmentEvaluationService;
import com.zukunftai.evidyalaya.model.FacultyAnswerEvaluationRequest;
import com.zukunftai.evidyalaya.model.FacultyEvaluationAttemptResponse;
import com.zukunftai.evidyalaya.service.impl.AdminAssessmentOverviewService;
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
 @GetMapping public List<AdminAssessmentOverviewResponse.Item> list(){return service.list();}
 @GetMapping("/{id}") public AdminAssessmentOverviewResponse.Detail detail(@PathVariable Long id){return service.detail(id);}
 @PostMapping("/faculty/{facultyId}/drafts")
 public ResponseEntity<Long> createForFaculty(@PathVariable Long facultyId, @Valid @RequestBody AssessmentRequest request) {
  return ResponseEntity.status(201).body(assessmentService.createDraftForFaculty(facultyId, request).getId());
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
