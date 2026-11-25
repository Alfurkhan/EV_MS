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
    public ReportData getFacultyDirectory() {
        return reportService.getFacultyDirectory();
    }

    @GetMapping("/faculty-directory/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportFacultyDirectory(@RequestParam(defaultValue = "pdf") String format) {
        return documentResponse(reportService.exportFacultyDirectory(format), format, "faculty-directory");
    }

    @GetMapping("/my-class-strength")
    @PreAuthorize("hasRole('FACULTY')")
    public ReportData getFacultyClassStrength(@RequestParam(required = false) Long academicYearId) {
        return reportService.getFacultyClassStrength(academicYearId);
    }

    @GetMapping("/my-class-strength/export")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<byte[]> exportFacultyClassStrength(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(defaultValue = "pdf") String format) {
        return documentResponse(reportService.exportFacultyClassStrength(academicYearId, format), format, "my-class-strength");
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
