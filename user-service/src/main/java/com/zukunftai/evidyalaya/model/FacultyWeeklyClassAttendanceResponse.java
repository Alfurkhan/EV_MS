package com.zukunftai.evidyalaya.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyWeeklyClassAttendanceResponse {

    private LocalDate weekStart;

    private LocalDate weekEnd;

    private List<FacultyClassAttendancePoint> dailyAttendance;

    private List<FacultyClassAttendanceSummary> classSummaries;

    private Double overallAverage;
}