package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GradeRequest {

    @NotNull(message = "Academic year is required")
    private Long academicYearId;

    @NotBlank(message = "Grade name is required")
    @Size(max = 50, message = "Grade name is too long")
    private String name;

    @Size(max = 500, message = "Description is too long")
    private String description;
}