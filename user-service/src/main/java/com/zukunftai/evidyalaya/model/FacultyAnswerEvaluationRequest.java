package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FacultyAnswerEvaluationRequest {
    @NotNull
    @DecimalMin("0.00")
    private BigDecimal marksAwarded;

    @Size(max = 4000)
    private String feedback;
}
