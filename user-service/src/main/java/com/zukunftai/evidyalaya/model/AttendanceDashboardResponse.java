package com.zukunftai.evidyalaya.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDashboardResponse {

    private Double overallPercentage;

    private Double todayPercentage;

    private List<AttendanceChartPoint> chart;
}