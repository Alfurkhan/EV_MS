package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.ClassType;
import lombok.Builder;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class TimetableResponse {

    private Long id;

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

    private DayOfWeek dayOfWeek;

    private LocalTime startTime;
    private LocalTime endTime;

    private ClassType classType;

    private LocalDate startDate;
    private LocalDate endDate;

    private String room;
    private String meetingLink;
    private String notes;

    private boolean active;

    private Instant createdAt;
    private Instant updatedAt;
}