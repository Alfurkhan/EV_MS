package com.zukunftai.evidyalaya.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.model.StudentAssessmentAttemptResponse;
import com.zukunftai.evidyalaya.model.StudentAssessmentResponse;
import java.util.List;

public interface StudentAssessmentService {
    List<StudentAssessmentResponse> listAvailable();
    StudentAssessmentAttemptResponse start(Long assessmentId);
    StudentAssessmentAttemptResponse getAttempt(Long attemptId);
    StudentAssessmentAttemptResponse saveAnswer(Long attemptId, Long questionId, JsonNode answer);
    StudentAssessmentAttemptResponse submit(Long attemptId);
    void deleteInProgressAttempt(Long attemptId);
}
