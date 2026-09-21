package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.AttendanceResponse;
import com.zukunftai.evidyalaya.model.MarkAttendanceRequest;
import com.zukunftai.evidyalaya.model.AttendanceStudentResponse;
import com.zukunftai.evidyalaya.model.AttendanceDashboardResponse;
import com.zukunftai.evidyalaya.model.FacultyWeeklyClassAttendanceResponse;
import com.zukunftai.evidyalaya.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(
            AttendanceService attendanceService
    ) {
        this.attendanceService = attendanceService;
    }

    /**
     * Get attendance records for a class session.
     *
     * Faculty can only view attendance
     * for classes they own.
     */
    @GetMapping("/session/{classSessionId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceForSession(
            @PathVariable Long classSessionId
    ) {

        return ResponseEntity.ok(
                attendanceService.getAttendanceForSession(
                        classSessionId
                )
        );
    }

    @GetMapping("/session/{classSessionId}/students")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<AttendanceStudentResponse>> getStudentsForSession(
            @PathVariable Long classSessionId
    ) {
        return ResponseEntity.ok(
                attendanceService.getStudentsForSession(
                        classSessionId
                )
        );
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<AttendanceDashboardResponse> getDashboardAttendance() {
        return ResponseEntity.ok(
                attendanceService.getDashboardAttendance()
        );
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AttendanceResponse>> getMyAttendance() {

        return ResponseEntity.ok(
                attendanceService.getMyAttendance()
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceResponse>> getAdminAttendance() {

        return ResponseEntity.ok(
                attendanceService.getAdminAttendance()
        );
    }

    @GetMapping("/faculty/weekly-classes")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<FacultyWeeklyClassAttendanceResponse>
    getFacultyWeeklyClassAttendance() {

        return ResponseEntity.ok(
                attendanceService.getFacultyWeeklyClassAttendance()
        );
    }

    /**
     * Mark or update attendance for students
     * in a class session.
     */
    @PostMapping("/mark")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<AttendanceResponse>> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request
    ) {

        return ResponseEntity.ok(
                attendanceService.markAttendance(
                        request
                )
        );
    }
}