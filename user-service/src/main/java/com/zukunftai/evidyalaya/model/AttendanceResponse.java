package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class AttendanceResponse {

    private Long id;

    private Long classSessionId;
    private LocalDate sessionDate;

    private Long timetableId;

    private Long studentId;
    private String studentName;
    private String studentEmail;

    private String facultyName;
    private String facultyEmail;

    private String subjectName;
    private String subjectCode;
    private String gradeName;
    private String sectionName;

    private AttendanceStatus status;
    private String remarks;

    private Instant createdAt;
    private Instant updatedAt;
}