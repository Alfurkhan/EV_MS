package com.zukunftai.evidyalaya.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.zukunftai.evidyalaya.database.AssessmentQuestionType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AssessmentQuestionRequest {
    @NotBlank @Size(max = 10000)
    private String questionText;
    @NotNull
    private AssessmentQuestionType questionType;
    private List<@NotBlank @Size(max = 1000) String> options;
    private JsonNode correctAnswer;
    @NotNull @DecimalMin(value = "0.01")
    private BigDecimal marks;
    @NotNull @Min(0)
    private Integer position;
}