package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SectionResponse {

    private Long id;

    private Long gradeId;

    private String gradeName;

    private Long academicYearId;

    private String academicYearName;

    private String name;

    private String description;

    private boolean active;

    private Instant createdAt;

    private Instant updatedAt;
}