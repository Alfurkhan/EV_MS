package com.zukunftai.evidyalaya.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.database.AssessmentQuestionType;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class AssessmentQuestionResponse {
    private Long id;
    private String questionText;
    private AssessmentQuestionType questionType;
    private List<String> options;
    private JsonNode correctAnswer;
    private BigDecimal marks;
    private Integer position;
}