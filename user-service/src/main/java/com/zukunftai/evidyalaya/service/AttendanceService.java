package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.model.AttendanceDashboardResponse;
import com.zukunftai.evidyalaya.model.AttendanceResponse;
import com.zukunftai.evidyalaya.model.AttendanceStudentResponse;
import com.zukunftai.evidyalaya.model.FacultyWeeklyClassAttendanceResponse;
import com.zukunftai.evidyalaya.model.MarkAttendanceRequest;

import java.util.List;

public interface AttendanceService {

    List<AttendanceResponse> getAttendanceForSession(
            Long classSessionId
    );

    List<AttendanceStudentResponse> getStudentsForSession(
            Long classSessionId
    );

    List<AttendanceResponse> markAttendance(
            MarkAttendanceRequest request
    );

    List<AttendanceResponse> getMyAttendance();

    List<AttendanceResponse> getAdminAttendance();

    AttendanceDashboardResponse getDashboardAttendance();

    FacultyWeeklyClassAttendanceResponse
    getFacultyWeeklyClassAttendance();
}