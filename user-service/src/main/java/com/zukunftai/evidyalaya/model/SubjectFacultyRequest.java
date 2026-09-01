package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubjectFacultyRequest {

    @NotNull(message = "Faculty ID is required")
    private Long facultyId;
}