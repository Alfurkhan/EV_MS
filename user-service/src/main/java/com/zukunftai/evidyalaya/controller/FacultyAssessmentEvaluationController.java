package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.FacultyAnswerEvaluationRequest;
import com.zukunftai.evidyalaya.model.FacultyEvaluationAttemptResponse;
import com.zukunftai.evidyalaya.service.impl.FacultyAssessmentEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/assessments/faculty")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FACULTY')")
public class FacultyAssessmentEvaluationController {
    private final FacultyAssessmentEvaluationService service;

    @GetMapping("/{assessmentId}/evaluations")
    public List<FacultyEvaluationAttemptResponse> listAttempts(@PathVariable Long assessmentId) {
        return service.listAttempts(assessmentId);
    }

    @GetMapping("/{assessmentId}/evaluations/{attemptId}")
    public FacultyEvaluationAttemptResponse getAttempt(@PathVariable Long assessmentId,
            @PathVariable Long attemptId) {
        return service.getAttempt(assessmentId, attemptId);
    }

    @PostMapping("/{assessmentId}/publish-results")
    public void publishResults(@PathVariable Long assessmentId) {
        service.publishResults(assessmentId);
    }

    @PutMapping("/{assessmentId}/evaluations/{attemptId}/answers/{questionId}")
    public FacultyEvaluationAttemptResponse evaluateAnswer(@PathVariable Long assessmentId,
            @PathVariable Long attemptId, @PathVariable Long questionId,
            @Valid @RequestBody FacultyAnswerEvaluationRequest request) {
        return service.evaluateAnswer(assessmentId, attemptId, questionId, request);
    }
}
