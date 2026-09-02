package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class StudentEnrollmentResponse {

    private Long id;

    private Long studentId;

    private String studentName;

    private String studentEmail;

    private Long academicYearId;

    private String academicYearName;

    private Long gradeId;

    private String gradeName;

    private Long sectionId;

    private String sectionName;

    private boolean active;

    private Instant createdAt;

    private Instant updatedAt;
}