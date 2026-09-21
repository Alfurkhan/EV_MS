package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.ClassType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class FacultyMyClassResponse {

    private Long timetableId;
    private Long sessionId;

    private LocalDate sessionDate;

    /**
     * NOT_STARTED means today's timetable exists,
     * but no ClassSession has been created yet.
     *
     * IN_PROGRESS means the faculty has started the class.
     *
     * COMPLETED means the faculty has ended the class.
     */
    private String status;

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

    private LocalDate startDate;
    private LocalDate endDate;

    private ClassType classType;

    private String room;
    private String meetingLink;
    private String notes;
}
