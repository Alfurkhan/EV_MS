package com.zukunftai.evidyalaya.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.database.AssessmentQuestionType;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class FacultyEvaluationAnswerResponse {
    private Long questionId;
    private String questionText;
    private AssessmentQuestionType questionType;
    private JsonNode options;
    private JsonNode correctAnswer;
    private JsonNode submittedAnswer;
    private BigDecimal maximumMarks;
    private BigDecimal marksAwarded;
    private String feedback;
    private boolean manualEvaluation;
}
