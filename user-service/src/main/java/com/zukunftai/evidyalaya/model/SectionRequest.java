package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SectionRequest {

    @NotNull(message = "Grade is required")
    private Long gradeId;

    @NotBlank(message = "Section name is required")
    @Size(max = 50, message = "Section name is too long")
    private String name;

    @Size(max = 500, message = "Description is too long")
    private String description;
}