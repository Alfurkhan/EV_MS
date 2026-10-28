package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentRequest {
    @NotBlank @Size(max = 200)
    private String title;

    @NotBlank @Size(max = 20000)
    private String instructions;

    @NotNull private Long academicYearId;
    @NotNull private Long gradeId;
    @NotNull private Long sectionId;
    @NotNull private Long subjectId;
    @NotNull private LocalDateTime dueAt;
}
