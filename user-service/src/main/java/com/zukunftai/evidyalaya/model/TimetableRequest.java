package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.ClassType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class TimetableRequest {

    @NotNull(message = "Academic year is required")
    private Long academicYearId;

    @NotNull(message = "Grade is required")
    private Long gradeId;

    @NotNull(message = "Section is required")
    private Long sectionId;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Faculty is required")
    private Long facultyId;

    @NotNull(message = "Day of week is required")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Class type is required")
    private ClassType classType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Size(
            max = 100,
            message = "Room cannot exceed 100 characters"
    )
    private String room;

    @Size(
            max = 500,
            message = "Meeting link cannot exceed 500 characters"
    )
    private String meetingLink;

    @Size(
            max = 500,
            message = "Notes cannot exceed 500 characters"
    )
    private String notes;

    private Boolean active;
}