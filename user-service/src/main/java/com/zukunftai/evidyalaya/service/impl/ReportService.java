package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.ReportData;
import com.zukunftai.evidyalaya.model.AttendanceStatus;
import com.zukunftai.evidyalaya.model.ClassSessionStatus;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import com.zukunftai.evidyalaya.service.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFDrawing;
import org.apache.poi.xssf.usermodel.XSSFClientAnchor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import javax.imageio.ImageIO;
import org.apache.poi.util.Units;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private static final DateTimeFormatter GENERATED_AT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final String DEFAULT_PRIMARY = "#2563EB";
    private static final String DEFAULT_ACCENT = "#0D9488";

    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final SchoolSettingsService schoolSettingsService;
    private final UserService userService;
    private final SchoolBrandingStorageService brandingStorageService;

    public ReportData getStudentRoster(Long academicYearId, Long gradeId, Long sectionId) {
        AcademicYear year = resolveAcademicYear(academicYearId);
        User actor = userService.getPrincipal();
        boolean isFaculty = hasRole(actor, RoleName.ROLE_FACULTY);
        Set<SectionScope> facultyScope = isFaculty ? getFacultyScope(actor, year) : Set.of();

        if (isFaculty && facultyScope.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have assigned classes for this academic year.");
        }

        if (gradeId != null) {
            Grade grade = gradeRepository.findById(gradeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found."));
            if (!grade.getAcademicYear().getId().equals(year.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected grade does not belong to the selected academic year.");
            }
        }
        Section selectedSection = null;
        if (sectionId != null) {
            selectedSection = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found."));
            if (!selectedSection.getGrade().getAcademicYear().getId().equals(year.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected academic year.");
            }
            if (gradeId != null && !selectedSection.getGrade().getId().equals(gradeId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected grade.");
            }
        }

        List<StudentEnrollment> enrollments = enrollmentRepository.findByAcademicYearAndActiveTrue(year);
        List<List<String>> rows = enrollments.stream()
                .filter(enrollment -> gradeId == null || enrollment.getGrade().getId().equals(gradeId))
                .filter(enrollment -> sectionId == null || enrollment.getSection().getId().equals(sectionId))
                .filter(enrollment -> !isFaculty || facultyScope.contains(new SectionScope(
                        enrollment.getGrade().getId(), enrollment.getSection().getId())))
                .sorted(Comparator.comparing((StudentEnrollment e) -> e.getGrade().getName())
                        .thenComparing(e -> e.getSection().getName())
                        .thenComparing(e -> Optional.ofNullable(e.getStudent().getFullName()).orElse("").toLowerCase()))
                .map(e -> List.of(
                        safe(e.getStudent().getFullName()),
                        safe(e.getStudent().getEmail()),
                        safe(e.getStudent().getPhoneNumber()),
                        safe(e.getGrade().getName()),
                        safe(e.getSection().getName()),
                        e.isActive() ? "Active" : "Inactive"
                ))
                .toList();

        String title = isFaculty ? "Assigned Class Student Roster" : "Student Enrollment Report";
        String filterDescription;
        if (selectedSection != null) {
            filterDescription = "Grade: " + selectedSection.getGrade().getName() + " · Section: " + selectedSection.getName();
        } else if (gradeId != null) {
            Grade selectedGrade = gradeRepository.findById(gradeId).orElseThrow();
            filterDescription = "Grade: " + selectedGrade.getName() + " · All sections";
        } else {
            filterDescription = "All grades and sections";
        }
        return buildReport(title, year.getName(), List.of("Student", "Email", "Phone", "Grade", "Section", "Enrollment"), rows,
                isFaculty ? "Faculty access · " + filterDescription : filterDescription);
    }

    public ReportData getFacultyDirectory() {
        return getFacultyDirectory(null, "all");
    }

    public ReportData getFacultyDirectory(Long subjectId, String accountStatus) {
        User actor = userService.getPrincipal();
        if (!hasRole(actor, RoleName.ROLE_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can generate the faculty directory.");
        }

        Set<Long> subjectFacultyIds = null;
        Subject selectedSubject = null;
        if (subjectId != null) {
            selectedSubject = subjectRepository.findByIdWithFaculties(subjectId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found."));
            subjectFacultyIds = selectedSubject.getFaculties().stream().map(User::getId).collect(java.util.stream.Collectors.toSet());
        }
        String status = accountStatus == null ? "all" : accountStatus.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("all", "enabled", "disabled").contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid account status.");
        final Set<Long> selectedFacultyIds = subjectFacultyIds;
        List<User> faculty = userRepository.findAll().stream()
                .filter(user -> hasRole(user, RoleName.ROLE_FACULTY) && !user.isAccountDeleted())
                .filter(user -> selectedFacultyIds == null || selectedFacultyIds.contains(user.getId()))
                .filter(user -> status.equals("all") || (status.equals("enabled") == user.isAccountEnabled()))
                .sorted(Comparator.comparing(user -> Optional.ofNullable(user.getFullName()).orElse("").toLowerCase()))
                .toList();

        String selectedSubjectName = selectedSubject == null ? "" : selectedSubject.getName();
        Map<Long, String> subjectNames = new HashMap<>();
        subjectRepository.findAllWithFaculties().forEach(subject ->
                subject.getFaculties().forEach(user ->
                        subjectNames.merge(user.getId(), subject.getName(), (oldValue, newValue) -> oldValue + ", " + newValue)));

        List<List<String>> rows = faculty.stream()
                .map(user -> List.of(
                        safe(user.getFullName()),
                        safe(user.getEmail()),
                        safe(user.getPhoneNumber()),
                        subjectId == null ? safe(subjectNames.get(user.getId())) : selectedSubjectName,
                        user.isAccountEnabled() ? "Enabled" : "Disabled",
                        user.isAccountLocked() ? "Locked" : "Unlocked"
                ))
                .toList();

        return buildReport("Faculty Directory", null,
                List.of("Faculty Name", "Email", "Phone", "Assigned Subjects", "Account", "Security"), rows,
                (selectedSubject == null ? "All subjects" : "Subject: " + selectedSubject.getName()) + " · " + (status.equals("all") ? "All account statuses" : "Account: " + (status.equals("enabled") ? "Enabled" : "Disabled")));
    }

    public byte[] exportStudentRoster(Long academicYearId, Long gradeId, Long sectionId, String format) {
        return export(getStudentRoster(academicYearId, gradeId, sectionId), format);
    }

    public byte[] exportFacultyDirectory(String format) {
        return exportFacultyDirectory(null, "all", format);
    }

    public byte[] exportFacultyDirectory(Long subjectId, String accountStatus, String format) {
        return export(getFacultyDirectory(subjectId, accountStatus), format);
    }


    public ReportData getAttendanceReport(
            Long academicYearId,
            Long gradeId,
            Long sectionId,
            java.time.LocalDate fromDate,
            java.time.LocalDate toDate,
            String attendanceStatus
    ) {
        User actor = userService.getPrincipal();
        boolean isAdmin = hasRole(actor, RoleName.ROLE_ADMIN);
        boolean isFaculty = hasRole(actor, RoleName.ROLE_FACULTY);
        if (!isAdmin && !isFaculty) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attendance reports are available to administrators and faculty.");
        }

        AcademicYear year = resolveAcademicYear(academicYearId);
        Set<SectionScope> facultyScope = isFaculty ? getFacultyScope(actor, year) : Set.of();
        if (isFaculty && facultyScope.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have assigned classes for this academic year.");
        }

        Grade selectedGrade = null;
        if (gradeId != null) {
            selectedGrade = gradeRepository.findById(gradeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found."));
            if (!selectedGrade.getAcademicYear().getId().equals(year.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected grade does not belong to the selected academic year.");
            }
            if (isFaculty && facultyScope.stream().noneMatch(scope -> scope.gradeId().equals(gradeId))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to the selected grade.");
            }
        }

        Section selectedSection = null;
        if (sectionId != null) {
            selectedSection = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found."));
            if (!selectedSection.getGrade().getAcademicYear().getId().equals(year.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected academic year.");
            }
            if (gradeId != null && !selectedSection.getGrade().getId().equals(gradeId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected grade.");
            }
            SectionScope selectedScope = new SectionScope(selectedSection.getGrade().getId(), selectedSection.getId());
            if (isFaculty && !facultyScope.contains(selectedScope)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to the selected section.");
            }
        }

        java.time.LocalDate requestedStart = fromDate == null ? year.getStartDate() : fromDate;
        java.time.LocalDate requestedEnd = toDate == null ? year.getEndDate() : toDate;
        if (requestedStart.isAfter(requestedEnd)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The start date must be on or before the end date.");
        }
        java.time.LocalDate effectiveStart = requestedStart.isBefore(year.getStartDate()) ? year.getStartDate() : requestedStart;
        java.time.LocalDate effectiveEnd = requestedEnd.isAfter(year.getEndDate()) ? year.getEndDate() : requestedEnd;
        boolean dateRangeWithinYear = !effectiveStart.isAfter(effectiveEnd);

        String status = attendanceStatus == null || attendanceStatus.isBlank()
                ? "ALL" : attendanceStatus.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ALL", "PRESENT", "ABSENT", "LATE", "EXCUSED", "UNMARKED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attendance status filter.");
        }

        List<StudentEnrollment> enrollments = enrollmentRepository.findByAcademicYearAndActiveTrue(year).stream()
                .filter(enrollment -> gradeId == null || enrollment.getGrade().getId().equals(gradeId))
                .filter(enrollment -> sectionId == null || enrollment.getSection().getId().equals(sectionId))
                .filter(enrollment -> !isFaculty || facultyScope.contains(new SectionScope(
                        enrollment.getGrade().getId(), enrollment.getSection().getId())))
                .sorted(Comparator.comparing((StudentEnrollment e) -> e.getGrade().getName())
                        .thenComparing(e -> e.getSection().getName())
                        .thenComparing(e -> Optional.ofNullable(e.getStudent().getFullName()).orElse("").toLowerCase(Locale.ROOT)))
                .toList();

        List<ClassSession> sessions = dateRangeWithinYear
                ? classSessionRepository.findBySessionDateBetweenAndStatus(effectiveStart, effectiveEnd, ClassSessionStatus.COMPLETED)
                : List.of();
        sessions = sessions.stream()
                .filter(session -> session.getTimetable().getAcademicYear().getId().equals(year.getId()))
                .filter(session -> session.getTimetable().getStatus() == TimetableStatus.APPROVED)
                .filter(session -> gradeId == null || session.getTimetable().getGrade().getId().equals(gradeId))
                .filter(session -> sectionId == null || session.getTimetable().getSection().getId().equals(sectionId))
                .filter(session -> !isFaculty || facultyScope.contains(new SectionScope(
                        session.getTimetable().getGrade().getId(), session.getTimetable().getSection().getId())))
                .sorted(Comparator.comparing(ClassSession::getSessionDate)
                        .thenComparing(session -> session.getTimetable().getGrade().getName())
                        .thenComparing(session -> session.getTimetable().getSection().getName())
                        .thenComparing(session -> session.getTimetable().getstartTimeSafe()))
                .toList();

        Map<StudentAttendanceKey, AttendanceReportCounts> studentCounts = new LinkedHashMap<>();
        Map<StudentAttendanceKey, StudentEnrollment> enrollmentByKey = new HashMap<>();
        for (StudentEnrollment enrollment : enrollments) {
            StudentAttendanceKey key = new StudentAttendanceKey(enrollment.getStudent().getId(),
                    enrollment.getGrade().getId(), enrollment.getSection().getId());
            studentCounts.put(key, new AttendanceReportCounts());
            enrollmentByKey.put(key, enrollment);
        }

        Map<Long, Map<StudentAttendanceKey, AttendanceStatus>> statusBySession = new HashMap<>();
        List<Attendance> records = sessions.isEmpty() ? List.of() : attendanceRepository.findByClassSessionIn(sessions);
        for (Attendance record : records) {
            ClassSession session = record.getClassSession();
            StudentAttendanceKey key = new StudentAttendanceKey(record.getStudent().getId(),
                    session.getTimetable().getGrade().getId(), session.getTimetable().getSection().getId());
            if (!studentCounts.containsKey(key)) continue;
            statusBySession.computeIfAbsent(session.getId(), ignored -> new HashMap<>()).put(key, record.getStatus());
        }

        for (ClassSession session : sessions) {
            Timetable timetable = session.getTimetable();
            List<StudentEnrollment> sessionEnrollments = enrollments.stream()
                    .filter(enrollment -> enrollment.getGrade().getId().equals(timetable.getGrade().getId())
                            && enrollment.getSection().getId().equals(timetable.getSection().getId()))
                    .toList();
            Map<StudentAttendanceKey, AttendanceStatus> sessionRecords =
                    statusBySession.getOrDefault(session.getId(), Map.of());
            for (StudentEnrollment enrollment : sessionEnrollments) {
                StudentAttendanceKey key = new StudentAttendanceKey(enrollment.getStudent().getId(),
                        enrollment.getGrade().getId(), enrollment.getSection().getId());
                AttendanceReportCounts counts = studentCounts.get(key);
                if (counts == null) continue;
                counts.sessions++;
                AttendanceStatus recordStatus = sessionRecords.get(key);
                if (recordStatus != null) counts.increment(recordStatus);
                else counts.unmarked++;
            }
        }

        List<List<String>> studentRows = enrollments.stream()
                .filter(enrollment -> {
                    StudentAttendanceKey key = new StudentAttendanceKey(enrollment.getStudent().getId(),
                            enrollment.getGrade().getId(), enrollment.getSection().getId());
                    AttendanceReportCounts counts = studentCounts.get(key);
                    return status.equals("ALL") || counts.has(status);
                })
                .map(enrollment -> {
                    StudentAttendanceKey key = new StudentAttendanceKey(enrollment.getStudent().getId(),
                            enrollment.getGrade().getId(), enrollment.getSection().getId());
                    AttendanceReportCounts counts = studentCounts.get(key);
                    return List.of(
                            safe(enrollment.getStudent().getFullName()),
                            safe(enrollment.getStudent().getEmail()),
                            enrollment.getGrade().getName(),
                            enrollment.getSection().getName(),
                            String.valueOf(counts.sessions),
                            String.valueOf(counts.present),
                            String.valueOf(counts.late),
                            String.valueOf(counts.absent),
                            String.valueOf(counts.excused),
                            String.valueOf(counts.unmarked),
                            counts.attendancePercent()
                    );
                }).toList();

        List<List<String>> sessionRows = sessions.stream().map(session -> {
            Timetable timetable = session.getTimetable();
            List<StudentEnrollment> sessionEnrollments = enrollments.stream()
                    .filter(enrollment -> enrollment.getGrade().getId().equals(timetable.getGrade().getId())
                            && enrollment.getSection().getId().equals(timetable.getSection().getId()))
                    .toList();
            Map<StudentAttendanceKey, AttendanceStatus> sessionRecords =
                    statusBySession.getOrDefault(session.getId(), Map.of());
            AttendanceReportCounts sessionCounts = new AttendanceReportCounts();
            for (AttendanceStatus recordStatus : sessionRecords.values()) sessionCounts.increment(recordStatus);
            int expected = sessionEnrollments.size();
            int unmarked = Math.max(0, expected - sessionRecords.size());
            return List.of(
                    session.getSessionDate().toString(),
                    timetable.getGrade().getName(),
                    timetable.getSection().getName(),
                    safe(timetable.getSubject().getName()),
                    safe(timetable.getFaculty().getFullName()),
                    String.valueOf(expected),
                    String.valueOf(sessionCounts.present),
                    String.valueOf(sessionCounts.late),
                    String.valueOf(sessionCounts.absent),
                    String.valueOf(sessionCounts.excused),
                    String.valueOf(unmarked),
                    unmarked == 0 ? "Complete" : "Incomplete"
            );
        }).toList();

        AttendanceReportCounts totals = new AttendanceReportCounts();
        int expectedTotal = 0;
        int unmarkedTotal = 0;
        for (AttendanceReportCounts counts : studentCounts.values()) {
            totals.present += counts.present;
            totals.late += counts.late;
            totals.absent += counts.absent;
            totals.excused += counts.excused;
            totals.unmarked += counts.unmarked;
            expectedTotal += counts.sessions;
            unmarkedTotal += counts.unmarked;
        }
        int recordedTotal = expectedTotal - unmarkedTotal;
        List<ReportData.SummaryMetric> metrics = List.of(
                metric("Completed Sessions", String.valueOf(sessions.size())),
                metric("Enrolled Students", String.valueOf(enrollments.size())),
                metric("Expected Attendance Entries", String.valueOf(expectedTotal)),
                metric("Recorded Entries", String.valueOf(recordedTotal)),
                metric("Unmarked Entries", String.valueOf(unmarkedTotal)),
                metric("Present", String.valueOf(totals.present)),
                metric("Late", String.valueOf(totals.late)),
                metric("Absent", String.valueOf(totals.absent)),
                metric("Excused", String.valueOf(totals.excused)),
                metric("Attendance Rate", totals.attendancePercent())
        );

        String filterText = "Date: " + effectiveStart + " to " + effectiveEnd;
        if (selectedSection != null) filterText += " · Grade: " + selectedSection.getGrade().getName() + " · Section: " + selectedSection.getName();
        else if (selectedGrade != null) filterText += " · Grade: " + selectedGrade.getName() + " · All sections";
        else filterText += " · All grades and sections";
        if (!status.equals("ALL")) filterText += " · Status: " + status;
        if (isFaculty) filterText = "Faculty assigned classes · " + filterText;

        return buildReport("Attendance Report", year.getName(),
                List.of("Student", "Email", "Grade", "Section", "Sessions", "Present", "Late", "Absent", "Excused", "Unmarked", "Attendance %"),
                studentRows, filterText, metrics,
                List.of(ReportData.ReportSection.builder()
                        .title("Session-wise Attendance Audit")
                        .columns(List.of("Date", "Grade", "Section", "Subject", "Faculty", "Enrolled", "Present", "Late", "Absent", "Excused", "Unmarked", "Marking"))
                        .rows(sessionRows)
                        .build()));
    }

    private ReportData.SummaryMetric metric(String label, String value) {
        return ReportData.SummaryMetric.builder().label(label).value(value).build();
    }

    private static class AttendanceReportCounts {
        int sessions;
        int present;
        int late;
        int absent;
        int excused;
        int unmarked;

        void increment(AttendanceStatus status) {
            switch (status) {
                case PRESENT -> present++;
                case LATE -> late++;
                case ABSENT -> absent++;
                case EXCUSED -> excused++;
            }
        }

        boolean has(String status) {
            return switch (status) {
                case "PRESENT" -> present > 0;
                case "LATE" -> late > 0;
                case "ABSENT" -> absent > 0;
                case "EXCUSED" -> excused > 0;
                case "UNMARKED" -> unmarked > 0;
                default -> true;
            };
        }

        String attendancePercent() {
            int denominator = present + late + absent;
            if (denominator == 0) return "—";
            return String.format(Locale.ROOT, "%.2f%%", ((present + late) * 100.0) / denominator);
        }
    }

    private record StudentAttendanceKey(Long studentId, Long gradeId, Long sectionId) {}

    public ReportData getFacultyClassStrength(Long academicYearId) {
        User actor = userService.getPrincipal();
        if (!hasRole(actor, RoleName.ROLE_FACULTY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This report is available to faculty.");
        }
        AcademicYear year = resolveAcademicYear(academicYearId);
        Set<SectionScope> scope = getFacultyScope(actor, year);
        List<List<String>> rows = scope.stream()
                .map(sectionScope -> {
                    Grade grade = gradeRepository.findById(sectionScope.gradeId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned grade not found."));
                    Section section = sectionRepository.findById(sectionScope.sectionId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned section not found."));
                    long count = enrollmentRepository.countByAcademicYearAndGradeAndSectionAndActiveTrue(year, grade, section);
                    return List.of(grade.getName(), section.getName(), String.valueOf(count));
                })
                .sorted(Comparator.comparing(row -> row.get(0) + " " + row.get(1)))
                .toList();
        return buildReport("My Class Strength", year.getName(), List.of("Grade", "Section", "Active Students"), rows, "Assigned classes only");
    }

    public byte[] exportFacultyClassStrength(Long academicYearId, String format) {
        return export(getFacultyClassStrength(academicYearId), format);
    }

    private Set<SectionScope> getFacultyScope(User faculty, AcademicYear year) {
        // Approved, active timetable assignments are the authorization source.
        // Subject-to-grade associations alone do not grant access to every section.
        Set<SectionScope> scope = new LinkedHashSet<>();
        timetableRepository.findByFacultyAndStatusAndActiveTrue(faculty, TimetableStatus.APPROVED).stream()
                .filter(timetable -> timetable.getAcademicYear().getId().equals(year.getId()))
                .filter(timetable -> timetable.getGrade().isActive() && timetable.getSection().isActive())
                .forEach(timetable -> scope.add(new SectionScope(timetable.getGrade().getId(), timetable.getSection().getId())));
        return scope;
    }

    private AcademicYear resolveAcademicYear(Long academicYearId) {
        if (academicYearId != null) {
            return academicYearRepository.findById(academicYearId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic year not found."));
        }
        return academicYearRepository.findByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active academic year is configured."));
    }

    private boolean hasRole(User user, RoleName role) {
        return user != null && user.getRoles() != null && user.getRoles().stream().anyMatch(item -> item.getName() == role);
    }

    private ReportData buildReport(String title, String year, List<String> columns, List<List<String>> rows, String subtitle) {
        return buildReport(title, year, columns, rows, subtitle, List.of(), List.of());
    }

    private ReportData buildReport(String title, String year, List<String> columns, List<List<String>> rows, String subtitle,
                                   List<ReportData.SummaryMetric> summary, List<ReportData.ReportSection> sections) {
        Map<String, String> settings = schoolSettingsService.getSettings();
        ReportData.SchoolIdentity identity = ReportData.SchoolIdentity.builder()
                .name(nonBlankOrDefault(settings.get("school.name"), "School"))
                .tagline(safe(settings.get("school.tagline")))
                .address(safe(settings.get("school.address")))
                .phone(safe(settings.get("school.phone")))
                .email(safe(settings.get("school.email")))
                .website(safe(settings.get("school.website")))
                .logoUrl(safe(settings.get("school.logoUrl")))
                .primaryColor(validColor(settings.get("theme.primaryColor"), DEFAULT_PRIMARY))
                .accentColor(validColor(settings.get("theme.accentColor"), DEFAULT_ACCENT))
                .build();
        String fullTitle = subtitle == null || subtitle.isBlank() ? title : title + " · " + subtitle;
        return ReportData.builder()
                .reportTitle(fullTitle)
                .generatedAt(LocalDateTime.now().format(GENERATED_AT))
                .academicYear(year)
                .school(identity)
                .columns(columns)
                .rows(rows)
                .summary(summary)
                .sections(sections)
                .build();
    }

    private byte[] export(ReportData data, String format) {
        String normalized = format == null ? "pdf" : format.trim().toLowerCase(Locale.ROOT);
        try {
            return switch (normalized) {
                case "pdf" -> createPdf(data);
                case "xlsx", "excel" -> createExcel(data);
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supported export formats are PDF and Excel (XLSX).");
            };
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate the requested report document.", exception);
        }
    }

    private byte[] createPdf(ReportData data) throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            int rowIndex = 0;
            int pageNumber = 0;
            int totalPages = Math.max(1, (int) Math.ceil(data.getRows().size() / 34.0));
            do {
                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);
                pageNumber++;
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    float margin = 36;
                    float pageWidth = page.getMediaBox().getWidth();
                    float usableWidth = pageWidth - margin * 2;
                    float y = page.getMediaBox().getHeight() - margin;

                    drawSchoolLogo(document, stream, data.getSchool().getLogoUrl(), pageWidth - margin - 42, y - 34);
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 15,
                            margin, y, data.getSchool().getName(), color(data.getSchool().getPrimaryColor()));
                    y -= 18;
                    if (!blank(data.getSchool().getTagline())) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9, margin, y,
                                data.getSchool().getTagline(), Color.DARK_GRAY);
                        y -= 14;
                    }
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13, margin, y,
                            data.getReportTitle(), Color.BLACK);
                    y -= 17;
                    String metadata = (blank(data.getAcademicYear()) ? "" : "Academic Year: " + data.getAcademicYear() + "  ·  ")
                            + "Generated: " + data.getGeneratedAt() + "  ·  Records: " + data.getRows().size();
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, margin, y, metadata, Color.DARK_GRAY);
                    y -= 12;
                    String contact = String.join("  ·  ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                            data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList());
                    if (!contact.isEmpty()) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7.5f, margin, y, contact, Color.DARK_GRAY);
                        y -= 16;
                    }

                    float headerHeight = 22;
                    float rowHeight = 18;
                    float[] columnRatios = pdfColumnRatios(data.getColumns());
                    float[] columnWidths = new float[data.getColumns().size()];
                    for (int col = 0; col < columnWidths.length; col++) columnWidths[col] = usableWidth * columnRatios[col];
                    stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                    stream.addRect(margin, y - headerHeight + 4, usableWidth, headerHeight);
                    stream.fill();
                    for (int col = 0; col < data.getColumns().size(); col++) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 8,
                                margin + pdfColumnOffset(columnWidths, col) + 4, y - 11, truncate(data.getColumns().get(col), 20), Color.WHITE);
                    }
                    y -= headerHeight;
                    int rowsOnPage = 0;
                    while (rowIndex < data.getRows().size() && rowsOnPage < 34) {
                        List<String> row = data.getRows().get(rowIndex);
                        if (rowIndex % 2 == 1) {
                            stream.setNonStrokingColor(new Color(245, 247, 250));
                            stream.addRect(margin, y - rowHeight + 4, usableWidth, rowHeight);
                            stream.fill();
                        }
                        for (int col = 0; col < data.getColumns().size(); col++) {
                            String value = col < row.size() ? row.get(col) : "";
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7.5f,
                                    margin + pdfColumnOffset(columnWidths, col) + 4, y - 10, truncate(value, pdfTextLimit(columnWidths[col])), Color.BLACK);
                        }
                        y -= rowHeight;
                        rowIndex++;
                        rowsOnPage++;
                    }
                    stream.setStrokingColor(color(data.getSchool().getAccentColor()));
                    stream.moveTo(margin, 30);
                    stream.lineTo(pageWidth - margin, 30);
                    stream.stroke();
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, margin, 18,
                            data.getSchool().getName() + " · Generated " + data.getGeneratedAt(), Color.DARK_GRAY);
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, pageWidth - margin - 40, 18,
                            "Page " + pageNumber + " of " + totalPages, Color.DARK_GRAY);
                }
            } while (rowIndex < data.getRows().size());
            document.save(output);
            return output.toByteArray();
        }
    }

    private void drawText(PDPageContentStream stream, PDType1Font font, float size, float x, float y, String text, Color color) throws Exception {
        stream.beginText();
        stream.setFont(font, size);
        stream.setNonStrokingColor(color);
        stream.newLineAtOffset(x, y);
        stream.showText(sanitizePdfText(truncate(text, 160)));
        stream.endText();
    }

    private byte[] createExcel(ReportData data) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);
            ((XSSFCellStyle) titleStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            ((XSSFCellStyle) headerStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            ((XSSFCellStyle) headerStyle).setBottomBorderColor(toXssfColor(workbook, data.getSchool().getAccentColor()));

            int lastColumn = Math.max(1, data.getColumns().size() - 1);
            for (int rowIndex = 0; rowIndex <= 4; rowIndex++) {
                Row headerRow = sheet.createRow(rowIndex);
                headerRow.setHeightInPoints(rowIndex == 0 ? 32 : 22);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIndex, rowIndex, 1, lastColumn));
            }
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 4, 0, 0));
            sheet.setColumnWidth(0, 16 * 256);
            Row schoolRow = sheet.getRow(0);
            schoolRow.createCell(1).setCellValue(data.getSchool().getName());
            schoolRow.getCell(1).setCellStyle(titleStyle);
            sheet.getRow(1).createCell(1).setCellValue(data.getSchool().getTagline());
            sheet.getRow(2).createCell(1).setCellValue(data.getReportTitle());
            sheet.getRow(3).createCell(1).setCellValue((data.getAcademicYear() == null ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                    + "Generated: " + data.getGeneratedAt() + " · Records: " + data.getRows().size());
            sheet.getRow(4).createCell(1).setCellValue(String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                    data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList()));

            Row headerRow = sheet.createRow(6);
            for (int column = 0; column < data.getColumns().size(); column++) {
                Cell cell = headerRow.createCell(column);
                cell.setCellValue(data.getColumns().get(column));
                cell.setCellStyle(headerStyle);
            }
            CellStyle alternateRowStyle = workbook.createCellStyle();
            alternateRowStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            alternateRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            for (int rowIndex = 0; rowIndex < data.getRows().size(); rowIndex++) {
                Row row = sheet.createRow(7 + rowIndex);
                List<String> values = data.getRows().get(rowIndex);
                for (int column = 0; column < data.getColumns().size(); column++) {
                    Cell cell = row.createCell(column);
                    cell.setCellValue(column < values.size() ? values.get(column) : "");
                    if (rowIndex % 2 == 1) cell.setCellStyle(alternateRowStyle);
                }
            }
            for (int column = 0; column < data.getColumns().size(); column++) {
                String heading = data.getColumns().get(column).toLowerCase(Locale.ROOT);
                int width = heading.contains("email") ? 36 : heading.contains("student") || heading.contains("faculty name") ? 30
                        : heading.contains("subject") ? 28 : heading.contains("phone") ? 18
                        : heading.contains("grade") ? 14 : heading.contains("section") ? 12 : 18;
                sheet.setColumnWidth(column, width * 256);
            }
            embedExcelLogo(workbook, sheet, data.getSchool().getLogoUrl());
            int dataEndRow = 7 + data.getRows().size();
            if (!data.getRows().isEmpty()) sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(6, dataEndRow - 1, 0, data.getColumns().size() - 1));
            sheet.createFreezePane(0, 7);
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private float pdfColumnOffset(float[] widths, int column) {
        float offset = 0;
        for (int i = 0; i < column; i++) offset += widths[i];
        return offset;
    }

    private int pdfTextLimit(float width) {
        return Math.max(8, (int) (width / 4.2f));
    }

    private float[] pdfColumnRatios(List<String> columns) {
        if (columns.size() == 6 && columns.get(0).equalsIgnoreCase("Student")) return new float[]{0.24f, 0.25f, 0.14f, 0.12f, 0.10f, 0.15f};
        if (columns.size() == 6 && columns.get(0).toLowerCase(Locale.ROOT).contains("faculty")) return new float[]{0.22f, 0.24f, 0.14f, 0.22f, 0.09f, 0.09f};
        float ratio = 1f / Math.max(1, columns.size());
        float[] widths = new float[columns.size()];
        Arrays.fill(widths, ratio);
        return widths;
    }

    private void drawSchoolLogo(PDDocument document, PDPageContentStream stream, String logoUrl, float x, float y) {
        if (blank(logoUrl) || !logoUrl.startsWith("/public/school-branding/logo/")) return;
        try {
            String fileName = logoUrl.substring("/public/school-branding/logo/".length());
            Path path = brandingStorageService.resolve(fileName);
            PDImageXObject image = PDImageXObject.createFromFileByContent(path.toFile(), document);
            float scale = Math.min(42f / image.getWidth(), 42f / image.getHeight());
            stream.drawImage(image, x, y, image.getWidth() * scale, image.getHeight() * scale);
        } catch (Exception ignored) {
            // Unsupported image formats or missing optional logo should not block report generation.
        }
    }

    private void embedExcelLogo(Workbook workbook, Sheet sheet, String logoUrl) {
        if (blank(logoUrl) || !logoUrl.startsWith("/public/school-branding/logo/") || !(workbook instanceof XSSFWorkbook xssf)) return;
        try {
            String fileName = logoUrl.substring("/public/school-branding/logo/".length());
            Path path = brandingStorageService.resolve(fileName);
            String extension = path.getFileName().toString().toLowerCase(Locale.ROOT);
            if (extension.endsWith(".webp")) return;
            int pictureType = extension.endsWith(".png") ? Workbook.PICTURE_TYPE_PNG : Workbook.PICTURE_TYPE_JPEG;

            var image = ImageIO.read(path.toFile());
            if (image == null) return;
            int imageWidth = image.getWidth();
            int imageHeight = image.getHeight();

            // Fit the image proportionally inside the existing merged logo area (A1:A5),
            // leaving a small inset and centering it in both directions.
            float availableWidth = sheet.getColumnWidthInPixels(0) - 12f;
            float availableHeight = 0f;
            for (int rowIndex = 0; rowIndex <= 4; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                availableHeight += (row == null ? sheet.getDefaultRowHeightInPoints() : row.getHeightInPoints()) * 96f / 72f;
            }
            availableHeight -= 12f;
            float scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
            float displayWidth = imageWidth * scale;
            float displayHeight = imageHeight * scale;
            float leftInset = (sheet.getColumnWidthInPixels(0) - displayWidth) / 2f;
            float topInset = (availableHeight + 12f - displayHeight) / 2f;

            int pictureIndex = workbook.addPicture(Files.readAllBytes(path), pictureType);
            XSSFDrawing drawing = (XSSFDrawing) sheet.createDrawingPatriarch();
            XSSFClientAnchor anchor = new XSSFClientAnchor(
                    Units.pixelToEMU(Math.round(leftInset)), Units.pixelToEMU(Math.round(topInset)),
                    Units.pixelToEMU(Math.round(displayWidth - sheet.getColumnWidthInPixels(0))),
                    Units.pixelToEMU(Math.round(displayHeight - (availableHeight + 12f))),
                    0, 0, 1, 5);
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_DONT_RESIZE);
            drawing.createPicture(anchor, pictureIndex);
        } catch (Exception ignored) {
            // Optional logo embedding must not prevent exporting a report.
        }
    }

    private XSSFColor toXssfColor(Workbook workbook, String hex) {
        return new XSSFColor(hexBytes(hex), null);
    }

    private byte[] hexBytes(String hex) {
        Color parsed = color(hex);
        return new byte[]{(byte) parsed.getRed(), (byte) parsed.getGreen(), (byte) parsed.getBlue()};
    }

    private Color color(String hex) {
        try {
            return Color.decode(validColor(hex, DEFAULT_PRIMARY));
        } catch (Exception ignored) {
            return Color.decode(DEFAULT_PRIMARY);
        }
    }

    private String validColor(String value, String fallback) {
        return value != null && value.matches("^#[0-9A-Fa-f]{6}$") ? value : fallback;
    }

    private String nonBlankOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String truncate(String value, int max) {
        String text = safe(value);
        return text.length() <= max ? text : text.substring(0, Math.max(1, max - 1)) + "…";
    }

    private String sanitizePdfText(String value) {
        return safe(value).replace("·", "-").replace("–", "-").replace("—", "-")
                .replace("’", "'").replace("“", "\"").replace("”", "\"")
                .replaceAll("[^\\x20-\\x7E]", "?");
    }

    private record SectionScope(Long gradeId, Long sectionId) {}
}
