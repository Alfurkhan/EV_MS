package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AssignmentGradeRequest {
    @NotNull @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal marks;

    @NotNull @DecimalMin(value = "0.01", inclusive = true)
    private BigDecimal maxMarks;

    @Size(max = 4000)
    private String feedback;
}
