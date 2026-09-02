package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class AcademicYearResponse {

    private Long id;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    private boolean active;

    private Instant createdAt;

    private Instant updatedAt;
}