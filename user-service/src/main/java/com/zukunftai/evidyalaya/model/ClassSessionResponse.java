package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class ClassSessionResponse {

    private Long id;

    private Long timetableId;

    private LocalDate sessionDate;

    private ClassSessionStatus status;

    private Instant startedAt;

    private Instant endedAt;

    private Integer durationMinutes;

    private Long academicYearId;
    private String academicYearName;

    private Long gradeId;
    private String gradeName;

    private Long sectionId;
    private String sectionName;

    private Long subjectId;
    private String subjectName;
    private String subjectCode;

    private Long facultyId;
    private String facultyName;
    private String facultyEmail;

    private LocalTime scheduledStartTime;
    private LocalTime scheduledEndTime;

    private String room;
}