package com.zukunftai.evidyalaya.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.model.StudentAssessmentAttemptResponse;
import com.zukunftai.evidyalaya.model.StudentAssessmentResponse;
import com.zukunftai.evidyalaya.service.StudentAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping(path = "/assessments/student", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentAssessmentController {
    private final StudentAssessmentService service;

    @GetMapping
    public List<StudentAssessmentResponse> listAvailable() { return service.listAvailable(); }

    @PostMapping("/{assessmentId}/attempts")
    public StudentAssessmentAttemptResponse start(@PathVariable Long assessmentId) { return service.start(assessmentId); }

    @GetMapping("/attempts/{attemptId}")
    public StudentAssessmentAttemptResponse getAttempt(@PathVariable Long attemptId) { return service.getAttempt(attemptId); }

    @PutMapping("/attempts/{attemptId}/answers/{questionId}")
    public StudentAssessmentAttemptResponse saveAnswer(@PathVariable Long attemptId, @PathVariable Long questionId,
            @RequestBody JsonNode answer) { return service.saveAnswer(attemptId, questionId, answer); }

    @DeleteMapping("/attempts/{attemptId}")
    public void deleteInProgressAttempt(@PathVariable Long attemptId) { service.deleteInProgressAttempt(attemptId); }

    @PostMapping("/attempts/{attemptId}/submit")
    public StudentAssessmentAttemptResponse submit(@PathVariable Long attemptId) { return service.submit(attemptId); }
}
