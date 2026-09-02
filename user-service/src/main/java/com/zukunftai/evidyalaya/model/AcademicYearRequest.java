package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AcademicYearRequest {

    @NotBlank(message = "Academic year name is required")
    @Size(
            max = 20,
            message = "Academic year name is too long"
    )
    private String name;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
}