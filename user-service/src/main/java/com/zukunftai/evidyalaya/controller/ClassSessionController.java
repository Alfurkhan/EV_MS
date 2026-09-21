package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.ClassSessionResponse;
import com.zukunftai.evidyalaya.model.FacultyMyClassResponse;
import com.zukunftai.evidyalaya.service.ClassSessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/class-session")
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    public ClassSessionController(
            ClassSessionService classSessionService
    ) {
        this.classSessionService = classSessionService;
    }

    // ============================================================
    // FACULTY — START CLASS
    // ============================================================

    @PostMapping("/start/{timetableId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ClassSessionResponse> startClass(
            @PathVariable Long timetableId
    ) {

        return ResponseEntity.ok(
                classSessionService.startClass(timetableId)
        );
    }

    // ============================================================
    // FACULTY — END CLASS
    // ============================================================

    @PostMapping("/end/{sessionId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ClassSessionResponse> endClass(
            @PathVariable Long sessionId
    ) {

        return ResponseEntity.ok(
                classSessionService.endClass(sessionId)
        );
    }

    // ============================================================
    // GET ONE SESSION
    // ============================================================

    @GetMapping("/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<ClassSessionResponse> getSessionById(
            @PathVariable Long sessionId
    ) {

        return ResponseEntity.ok(
                classSessionService.getSessionById(sessionId)
        );
    }

    // ============================================================
    // FACULTY — ALL MY SESSIONS
    // ============================================================

    @GetMapping("/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<ClassSessionResponse>> getMySessions() {

        return ResponseEntity.ok(
                classSessionService.getMySessions()
        );
    }

    @GetMapping("/my/today")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<FacultyMyClassResponse>> getMyClassesToday() {
        return ResponseEntity.ok(classSessionService.getMyClassesToday());
    }

    // ============================================================
    // FACULTY — MY SESSIONS FOR A DATE
    // ============================================================

    @GetMapping("/my/date/{date}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<ClassSessionResponse>> getMySessionsByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {

        return ResponseEntity.ok(
                classSessionService.getMySessionsByDate(date)
        );
    }

    // ============================================================
    // ADMIN — SESSIONS FOR A DATE
    // ============================================================

    @GetMapping("/date/{date}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClassSessionResponse>> getSessionsByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {

        return ResponseEntity.ok(
                classSessionService.getSessionsByDate(date)
        );
    }

    // ============================================================
    // ADMIN — SESSION HISTORY FOR A TIMETABLE
    // ============================================================

    @GetMapping("/timetable/{timetableId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClassSessionResponse>> getSessionsByTimetable(
            @PathVariable Long timetableId
    ) {

        return ResponseEntity.ok(
                classSessionService.getSessionsByTimetable(timetableId)
        );
    }
}