package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.AssessmentAttemptStatus;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class FacultyEvaluationAttemptResponse {
    private Long attemptId;
    private Long assessmentId;
    private String assessmentTitle;
    private String studentName;
    private String studentUsername;
    private AssessmentAttemptStatus status;
    private Instant startedAt;
    private Instant submittedAt;
    private BigDecimal score;
    private BigDecimal totalMarks;
    private boolean evaluationComplete;
    private List<FacultyEvaluationAnswerResponse> answers;
}
