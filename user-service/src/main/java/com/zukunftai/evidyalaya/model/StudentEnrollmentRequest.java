package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudentEnrollmentRequest {

    @NotNull(message = "Student is required")
    private Long studentId;

    @NotNull(message = "Academic year is required")
    private Long academicYearId;

    @NotNull(message = "Grade is required")
    private Long gradeId;

    @NotNull(message = "Section is required")
    private Long sectionId;
}