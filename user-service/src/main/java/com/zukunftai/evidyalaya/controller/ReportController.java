package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.ReportData;
import com.zukunftai.evidyalaya.service.impl.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {
    private static final MediaType XLSX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private final ReportService reportService;
    private final com.zukunftai.evidyalaya.service.impl.AcademicPerformanceReportService academicPerformanceReportService;

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ReportData getAttendanceReport(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(required = false) String status) {
        return reportService.getAttendanceReport(academicYearId, gradeId, sectionId, startDate, endDate, status);
    }

    @GetMapping("/attendance/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<byte[]> exportAttendanceReport(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] document = reportService.exportAttendanceReport(academicYearId, gradeId, sectionId, startDate, endDate, status, format);
        return documentResponse(document, format, "attendance-report");
    }

    @GetMapping("/student-roster")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ReportData getStudentRoster(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId) {
        return reportService.getStudentRoster(academicYearId, gradeId, sectionId);
    }

    @GetMapping("/student-roster/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<byte[]> exportStudentRoster(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] document = reportService.exportStudentRoster(academicYearId, gradeId, sectionId, format);
        return documentResponse(document, format, "student-roster");
    }

    @GetMapping("/faculty-directory")
    @PreAuthorize("hasRole('ADMIN')")
    public ReportData getFacultyDirectory(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String accountStatus) {
        return reportService.getFacultyDirectory(subjectId, accountStatus);
    }

    @GetMapping("/faculty-directory/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportFacultyDirectory(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(defaultValue = "pdf") String format) {
        return documentResponse(reportService.exportFacultyDirectory(subjectId, accountStatus, format), format, "faculty-directory");
    }

    @GetMapping("/my-class-scope")
    @PreAuthorize("hasRole('FACULTY')")
    public java.util.List<ReportService.FacultyReportScopeOption> getFacultyReportScope(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) String reportKind) {
        return reportService.getFacultyReportScope(academicYearId, reportKind);
    }

    @GetMapping("/my-class-strength")
    @PreAuthorize("hasRole('FACULTY')")
    public ReportData getFacultyClassStrength(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId) {
        return reportService.getFacultyClassStrength(academicYearId, gradeId, sectionId);
    }

    @GetMapping("/my-class-strength/export")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<byte[]> exportFacultyClassStrength(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(defaultValue = "pdf") String format) {
        return documentResponse(reportService.exportFacultyClassStrength(academicYearId, gradeId, sectionId, format), format, "my-class-strength");
    }

    @GetMapping("/academic-performance/{assessmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ReportData getAcademicPerformanceReport(@PathVariable Long assessmentId) {
        return academicPerformanceReportService.preview(assessmentId);
    }

    @GetMapping("/academic-performance/{assessmentId}/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportAcademicPerformanceReport(@PathVariable Long assessmentId,
            @RequestParam(defaultValue = "pdf") String format) {
        ReportData data = academicPerformanceReportService.preview(assessmentId);
        return documentResponse(academicPerformanceReportService.export(data, format), format, "academic-performance-report");
    }

    private ResponseEntity<byte[]> documentResponse(byte[] content, String format, String fileName) {
        String extension = format != null && (format.equalsIgnoreCase("xlsx") || format.equalsIgnoreCase("excel"))
                ? "xlsx" : "pdf";
        MediaType mediaType = extension.equals("xlsx") ? XLSX_MEDIA_TYPE : MediaType.APPLICATION_PDF;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "." + extension + "\"")
                .body(content);
    }
}
