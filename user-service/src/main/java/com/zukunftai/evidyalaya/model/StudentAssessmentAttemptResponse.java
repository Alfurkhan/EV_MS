package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data @Builder
public class StudentAssessmentAttemptResponse {
    private Long id;
    private Long assessmentId;
    private String assessmentTitle;
    private String status;
    private Instant startedAt;
    private Instant deadlineAt;
    private Instant submittedAt;
    private List<StudentAssessmentQuestionResponse> questions;
    private List<StudentAssessmentAnswerResponse> answers;
}
