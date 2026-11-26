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
        boolean isAdmin = hasRole(actor, RoleName.ROLE_ADMIN);
        boolean isFaculty = !isAdmin && hasRole(actor, RoleName.ROLE_FACULTY);
        Set<SectionScope> facultyScope = isFaculty ? getFacultyAttendanceScope(actor, year) : Set.of();

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
                isFaculty ? "Faculty assigned classes · " + filterDescription : filterDescription);
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

        List<StudentEnrollment> enrollments = enrollmentRepository.findByAcademicYear(year).stream()
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
                .filter(session -> !isFaculty || session.getTimetable().getFaculty().getId().equals(actor.getId()))
                .sorted(Comparator.comparing(ClassSession::getSessionDate)
                        .thenComparing(session -> session.getTimetable().getGrade().getName())
                        .thenComparing(session -> session.getTimetable().getSection().getName())
                        .thenComparing(session -> session.getTimetable().getStartTime()))
                .toList();

        Map<StudentAttendanceKey, AttendanceReportCounts> studentCounts = new LinkedHashMap<>();
        for (StudentEnrollment enrollment : enrollments) {
            StudentAttendanceKey key = new StudentAttendanceKey(enrollment.getStudent().getId(),
                    enrollment.getGrade().getId(), enrollment.getSection().getId());
            studentCounts.put(key, new AttendanceReportCounts());
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
                            counts.attendancePercent(),
                            counts.attendanceFlag()
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
                    timetable.getStartTime() == null ? "" : timetable.getStartTime().toString(),
                    timetable.getEndTime() == null ? "" : timetable.getEndTime().toString(),
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
        long lowAttendanceStudents = studentCounts.values().stream()
                .filter(counts -> counts.attendancePercentValue() != null && counts.attendancePercentValue() < 75.0)
                .count();
        long incompleteStudents = studentCounts.values().stream().filter(counts -> counts.unmarked > 0).count();
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
                metric("Overall Attendance Rate", totals.attendancePercent()),
                metric("Attendance Marking Completion", expectedTotal == 0 ? "—" : String.format(Locale.ROOT, "%.2f%%", recordedTotal * 100.0 / expectedTotal)), 
                metric("Students Below 75%", String.valueOf(lowAttendanceStudents)),
                metric("Students With Unmarked Sessions", String.valueOf(incompleteStudents))
        );

        String filterText = dateRangeWithinYear ? "Date: " + effectiveStart.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + " to " + effectiveEnd.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                : "Date: No overlap with the selected academic year";
        if (selectedSection != null) filterText += " · Grade: " + selectedSection.getGrade().getName() + " · Section: " + selectedSection.getName();
        else if (selectedGrade != null) filterText += " · Grade: " + selectedGrade.getName() + " · All sections";
        else filterText += " · All grades and sections";
        if (!status.equals("ALL")) filterText += " · Student status: " + status;
        if (isFaculty) filterText = "Faculty assigned classes · " + filterText;

        return buildReport("Attendance Report", year.getName(),
                List.of("Student", "Email", "Grade", "Section", "Sessions", "Present", "Late", "Absent", "Excused", "Unmarked", "Attendance Rate", "Attendance Flag"),
                studentRows, filterText, metrics,
                List.of(ReportData.ReportSection.builder()
                        .title("Session-wise Attendance Audit")
                        .columns(List.of("Date", "Start Time", "End Time", "Grade", "Section", "Subject", "Faculty", "Enrolled", "Present", "Late", "Absent", "Excused", "Unmarked", "Marking"))
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

        Double attendancePercentValue() {
            int denominator = present + late + absent;
            return denominator == 0 ? null : ((present + late) * 100.0) / denominator;
        }

        String attendancePercent() {
            Double percentage = attendancePercentValue();
            return percentage == null ? "—" : String.format(Locale.ROOT, "%.2f%%", percentage);
        }

        String attendanceFlag() {
            Double percentage = attendancePercentValue();
            if (percentage != null && percentage < 75.0) return "Low Attendance";
            if (unmarked > 0) return "Incomplete";
            if (percentage == null) return "No Sessions";
            return "Good";
        }
    }

    private record StudentAttendanceKey(Long studentId, Long gradeId, Long sectionId) {}

    public byte[] exportAttendanceReport(Long academicYearId, Long gradeId, Long sectionId,
                                         java.time.LocalDate fromDate, java.time.LocalDate toDate,
                                         String attendanceStatus, String format) {
        return export(getAttendanceReport(academicYearId, gradeId, sectionId, fromDate, toDate, attendanceStatus), format);
    }

    public List<FacultyReportScopeOption> getFacultyReportScope(Long academicYearId, String reportKind) {
        User actor = userService.getPrincipal();
        if (!hasRole(actor, RoleName.ROLE_FACULTY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This report scope is available to faculty.");
        }
        AcademicYear year = resolveAcademicYear(academicYearId);
        Set<SectionScope> reportScope = "student-roster".equalsIgnoreCase(reportKind)
                ? getFacultyAttendanceScope(actor, year) : getFacultyScope(actor, year);
        return reportScope.stream()
                .map(scope -> {
                    Grade grade = gradeRepository.findById(scope.gradeId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned grade not found."));
                    Section section = sectionRepository.findById(scope.sectionId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned section not found."));
                    return new FacultyReportScopeOption(grade.getId(), grade.getName(), section.getId(), section.getName());
                })
                .sorted(Comparator.comparing(FacultyReportScopeOption::gradeName).thenComparing(FacultyReportScopeOption::sectionName))
                .toList();
    }

    public ReportData getFacultyClassStrength(Long academicYearId, Long gradeId, Long sectionId) {
        User actor = userService.getPrincipal();
        if (!hasRole(actor, RoleName.ROLE_FACULTY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This report is available to faculty.");
        }
        AcademicYear year = resolveAcademicYear(academicYearId);
        Set<SectionScope> scope = getFacultyScope(actor, year);
        if (scope.isEmpty()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No assigned classes are available for this academic year.");
        if (gradeId != null && scope.stream().noneMatch(item -> item.gradeId().equals(gradeId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to the selected grade.");
        }
        if (sectionId != null && scope.stream().noneMatch(item -> item.sectionId().equals(sectionId) && (gradeId == null || item.gradeId().equals(gradeId)))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to the selected section.");
        }
        List<SectionScope> selectedScope = scope.stream()
                .filter(item -> gradeId == null || item.gradeId().equals(gradeId))
                .filter(item -> sectionId == null || item.sectionId().equals(sectionId))
                .sorted(Comparator.comparing(item -> {
                    Grade grade = gradeRepository.findById(item.gradeId()).orElseThrow();
                    Section section = sectionRepository.findById(item.sectionId()).orElseThrow();
                    return grade.getName() + " " + section.getName();
                })).toList();

        List<List<String>> rows = selectedScope.stream().map(item -> {
            Grade grade = gradeRepository.findById(item.gradeId()).orElseThrow();
            Section section = sectionRepository.findById(item.sectionId()).orElseThrow();
            long count = enrollmentRepository.countByAcademicYearAndGradeAndSectionAndActiveTrue(year, grade, section);
            return List.of(grade.getName(), section.getName(), String.valueOf(count));
        }).toList();

        List<StudentEnrollment> activeEnrollments = enrollmentRepository.findByAcademicYearAndActiveTrue(year);
        List<ReportData.ReportSection> detailSections = selectedScope.stream().map(item -> {
            Grade grade = gradeRepository.findById(item.gradeId()).orElseThrow();
            Section section = sectionRepository.findById(item.sectionId()).orElseThrow();
            List<List<String>> students = activeEnrollments.stream()
                    .filter(enrollment -> enrollment.getGrade().getId().equals(grade.getId())
                            && enrollment.getSection().getId().equals(section.getId()))
                    .sorted(Comparator.comparing(enrollment -> Optional.ofNullable(enrollment.getStudent().getFullName()).orElse("").toLowerCase(Locale.ROOT)))
                    .map(enrollment -> List.of(
                            blank(enrollment.getStudent().getUsername())
                                    ? "ID-" + enrollment.getStudent().getId()
                                    : enrollment.getStudent().getUsername(),
                            safe(enrollment.getStudent().getFullName()),
                            safe(enrollment.getStudent().getEmail()),
                            safe(enrollment.getStudent().getPhoneNumber())
                    )).toList();
            return ReportData.ReportSection.builder()
                    .title(grade.getName() + " · Section " + section.getName() + " Active Student Roster")
                    .columns(List.of("Student ID", "Student Name", "Email", "Phone"))
                    .rows(students)
                    .build();
        }).toList();

        long totalStudents = rows.stream().mapToLong(row -> Long.parseLong(row.get(2))).sum();
        List<ReportData.SummaryMetric> summary = List.of(
                metric("Assigned Sections", String.valueOf(selectedScope.size())),
                metric("Grades Covered", String.valueOf(selectedScope.stream().map(SectionScope::gradeId).distinct().count())),
                metric("Active Students", String.valueOf(totalStudents))
        );
        String scopeDescription = (gradeId == null ? "All assigned grades" : "Grade: " + rows.stream().map(row -> row.get(0)).findFirst().orElse(""))
                + (sectionId == null ? " · All assigned sections" : " · Section: " + rows.stream().map(row -> row.get(1)).findFirst().orElse(""));
        return buildReport("My Class Strength & Student Roster", year.getName(),
                List.of("Grade", "Section", "Active Students"), rows,
                scopeDescription, summary, detailSections);
    }

    public byte[] exportFacultyClassStrength(Long academicYearId, Long gradeId, Long sectionId, String format) {
        return export(getFacultyClassStrength(academicYearId, gradeId, sectionId), format);
    }

    public record FacultyReportScopeOption(Long gradeId, String gradeName, Long sectionId, String sectionName) {}


    private Set<SectionScope> getFacultyAttendanceScope(User faculty, AcademicYear year) {
        // For attendance history, include past approved assignments even if they have since expired.
        return timetableRepository.findByFaculty(faculty).stream()
                .filter(timetable -> timetable.getStatus() == TimetableStatus.APPROVED)
                .filter(timetable -> timetable.getAcademicYear().getId().equals(year.getId()))
                .map(timetable -> new SectionScope(timetable.getGrade().getId(), timetable.getSection().getId()))
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
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
        User reportActor = userService.getPrincipal();
        String preparedBy = hasRole(reportActor, RoleName.ROLE_FACULTY) ? safe(reportActor.getFullName()) : null;
        return ReportData.builder()
                .reportTitle(fullTitle)
                .preparedBy(preparedBy)
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
            int mainRowsPerPage = data.getColumns().size() >= 8 ? 30 : 32;
            int mainPages = Math.max(1, (int) Math.ceil(data.getRows().size() / (double) mainRowsPerPage));
            int sectionPages = data.getSections() == null ? 0 : data.getSections().stream()
                    .mapToInt(section -> Math.max(1, (int) Math.ceil(section.getRows().size() / 32.0))).sum();
            int totalPages = mainPages + sectionPages;
            int pageNumber = 0;

            for (int pageIndex = 0; pageIndex < mainPages; pageIndex++) {
                PDRectangle pageSize = data.getColumns().size() >= 8 ? new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()) : PDRectangle.A4;
                PDPage page = new PDPage(pageSize);
                document.addPage(page);
                pageNumber++;
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    float margin = 32;
                    float pageWidth = page.getMediaBox().getWidth();
                    float usableWidth = pageWidth - margin * 2;
                    float y = page.getMediaBox().getHeight() - margin;
                    drawSchoolLogo(document, stream, data.getSchool().getLogoUrl(), pageWidth - margin - 42, y - 34);
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14,
                            margin, y, data.getSchool().getName(), color(data.getSchool().getPrimaryColor()));
                    y -= 17;
                    if (!blank(data.getSchool().getTagline())) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, margin, y,
                                data.getSchool().getTagline(), Color.DARK_GRAY);
                        y -= 12;
                    }
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11,
                            margin, y, data.getReportTitle(), Color.BLACK);
                    y -= 15;
                    String metadata = (blank(data.getAcademicYear()) ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                            + "Generated: " + data.getGeneratedAt() + " · Records: " + data.getRows().size();
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, margin, y, metadata, Color.DARK_GRAY);
                    y -= 11;
                    if (!blank(data.getPreparedBy())) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7, margin, y,
                                "Report prepared by: " + data.getPreparedBy() + " (Faculty)", Color.DARK_GRAY);
                        y -= 11;
                    }
                    String contact = String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                            data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList());
                    if (!contact.isEmpty()) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6.5f, margin, y, contact, Color.DARK_GRAY);
                        y -= 12;
                    }
                    if (pageIndex == 0 && data.getSummary() != null && !data.getSummary().isEmpty()) {
                        for (int i = 0; i < data.getSummary().size(); i += 3) {
                            String line = data.getSummary().subList(i, Math.min(i + 3, data.getSummary().size())).stream()
                                    .map(metric -> metric.getLabel() + ": " + metric.getValue()).collect(java.util.stream.Collectors.joining("   ·   "));
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 6.5f, margin, y, line, Color.DARK_GRAY);
                            y -= 10;
                        }
                    }
                    float headerHeight = 20;
                    float rowHeight = data.getColumns().size() >= 8 ? 12.5f : 17;
                    float[] columnRatios = pdfColumnRatios(data.getColumns());
                    float[] columnWidths = new float[data.getColumns().size()];
                    for (int col = 0; col < columnWidths.length; col++) columnWidths[col] = usableWidth * columnRatios[col];
                    stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                    stream.addRect(margin, y - headerHeight + 3, usableWidth, headerHeight);
                    stream.fill();
                    float headerFontSize = data.getColumns().size() >= 8 ? 6.5f : 7.5f;
                    for (int col = 0; col < data.getColumns().size(); col++) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), headerFontSize,
                                margin + pdfColumnOffset(columnWidths, col) + 3, y - 10,
                                truncate(data.getColumns().get(col), data.getColumns().size() >= 8 ? 14 : 20), Color.WHITE);
                    }
                    y -= headerHeight;
                    int start = pageIndex * mainRowsPerPage;
                    int end = Math.min(data.getRows().size(), start + mainRowsPerPage);
                    for (int rowIndex = start; rowIndex < end; rowIndex++) {
                        List<String> row = data.getRows().get(rowIndex);
                        String attendanceFlag = data.getColumns().contains("Attendance Flag") && row.size() > data.getColumns().indexOf("Attendance Flag")
                                ? row.get(data.getColumns().indexOf("Attendance Flag")) : "";
                        Color rowBackground = attendanceFlag.equals("Low Attendance") ? new Color(255, 235, 235)
                                : attendanceFlag.equals("Incomplete") ? new Color(255, 247, 220)
                                : rowIndex % 2 == 1 ? new Color(245, 247, 250) : null;
                        if (rowBackground != null) {
                            stream.setNonStrokingColor(rowBackground);
                            stream.addRect(margin, y - rowHeight + 3, usableWidth, rowHeight);
                            stream.fill();
                        }
                        for (int col = 0; col < data.getColumns().size(); col++) {
                            String value = col < row.size() ? row.get(col) : "";
                            if (isNameColumn(data.getColumns().get(col))) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, 5.0f,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9, value, Color.BLACK, columnWidths[col] - 6);
                            } else if (data.getColumns().get(col).equalsIgnoreCase("Email")) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6, 4.25f,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9, value, Color.BLACK, columnWidths[col] - 6);
                            } else {
                                drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), data.getColumns().size() >= 8 ? 6 : 7,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9,
                                        truncate(value, pdfTextLimit(columnWidths[col])), Color.BLACK);
                            }
                        }
                        y -= rowHeight;
                    }
                    drawPdfFooter(stream, pageWidth, margin, pageNumber, totalPages, data);
                }
            }

            if (data.getSections() != null) {
                for (ReportData.ReportSection section : data.getSections()) {
                    int rowsPerPage = 32;
                    int pages = Math.max(1, (int) Math.ceil(section.getRows().size() / (double) rowsPerPage));
                    for (int pageIndex = 0; pageIndex < pages; pageIndex++) {
                        PDRectangle pageSize = section.getColumns().size() >= 8 ? new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()) : PDRectangle.A4;
                        PDPage page = new PDPage(pageSize);
                        document.addPage(page);
                        pageNumber++;
                        try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                            float margin = 32;
                            float pageWidth = page.getMediaBox().getWidth();
                            float usableWidth = pageWidth - margin * 2;
                            float y = page.getMediaBox().getHeight() - margin;
                            drawSchoolLogo(document, stream, data.getSchool().getLogoUrl(), pageWidth - margin - 42, y - 34);
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13,
                                    margin, y, data.getSchool().getName(), color(data.getSchool().getPrimaryColor()));
                            y -= 18;
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11,
                                    margin, y, section.getTitle(), Color.BLACK);
                            y -= 15;
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7,
                                    margin, y, "Academic Year: " + safe(data.getAcademicYear()) + " · " + data.getReportTitle(), Color.DARK_GRAY);
                            y -= 11;
                            if (!blank(data.getPreparedBy())) {
                                drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7, margin, y,
                                        "Report prepared by: " + data.getPreparedBy() + " (Faculty)", Color.DARK_GRAY);
                                y -= 11;
                            } else {
                                y -= 5;
                            }
                            float headerHeight = 20;
                            float rowHeight = section.getColumns().size() >= 8 ? 12.5f : 17;
                            float[] ratios = pdfColumnRatios(section.getColumns());
                            float[] widths = new float[ratios.length];
                            for (int col = 0; col < widths.length; col++) widths[col] = usableWidth * ratios[col];
                            stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                            stream.addRect(margin, y - headerHeight + 3, usableWidth, headerHeight);
                            stream.fill();
                            float headerSize = section.getColumns().size() >= 8 ? 6.5f : 7.5f;
                            for (int col = 0; col < section.getColumns().size(); col++) {
                                drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), headerSize,
                                        margin + pdfColumnOffset(widths, col) + 3, y - 10,
                                        truncate(section.getColumns().get(col), section.getColumns().size() >= 8 ? 14 : 20), Color.WHITE);
                            }
                            y -= headerHeight;
                            int start = pageIndex * rowsPerPage;
                            int end = Math.min(section.getRows().size(), start + rowsPerPage);
                            for (int rowIndex = start; rowIndex < end; rowIndex++) {
                                List<String> row = section.getRows().get(rowIndex);
                                if (rowIndex % 2 == 1) {
                                    stream.setNonStrokingColor(new Color(245, 247, 250));
                                    stream.addRect(margin, y - rowHeight + 3, usableWidth, rowHeight);
                                    stream.fill();
                                }
                                for (int col = 0; col < section.getColumns().size(); col++) {
                                    String value = col < row.size() ? row.get(col) : "";
                                    if (isNameColumn(section.getColumns().get(col))) {
                                    drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, 5.0f,
                                            margin + pdfColumnOffset(widths, col) + 3, y - 9, value, Color.BLACK, widths[col] - 6);
                                } else {
                                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), section.getColumns().size() >= 8 ? 6 : 7,
                                            margin + pdfColumnOffset(widths, col) + 3, y - 9,
                                            truncate(value, pdfTextLimit(widths[col])), Color.BLACK);
                                }
                                }
                                y -= rowHeight;
                            }
                            drawPdfFooter(stream, pageWidth, margin, pageNumber, totalPages, data);
                        }
                    }
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private void drawPdfFooter(PDPageContentStream stream, float pageWidth, float margin, int pageNumber, int totalPages, ReportData data) throws Exception {
        stream.setStrokingColor(color(data.getSchool().getAccentColor()));
        stream.moveTo(margin, 30);
        stream.lineTo(pageWidth - margin, 30);
        stream.stroke();
        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, margin, 18,
                data.getSchool().getName() + " · Generated " + data.getGeneratedAt(), Color.DARK_GRAY);
        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, pageWidth - margin - 40, 18,
                "Page " + pageNumber + " of " + totalPages, Color.DARK_GRAY);
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
            headerStyle.setWrapText(true);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            ((XSSFCellStyle) headerStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            ((XSSFCellStyle) headerStyle).setBottomBorderColor(toXssfColor(workbook, data.getSchool().getAccentColor()));

            CellStyle sectionStyle = workbook.createCellStyle();
            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 12);
            sectionFont.setColor(IndexedColors.WHITE.getIndex());
            sectionStyle.setFont(sectionFont);
            ((XSSFCellStyle) sectionStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle metricLabelStyle = workbook.createCellStyle();
            Font metricFont = workbook.createFont();
            metricFont.setBold(true);
            metricLabelStyle.setFont(metricFont);

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
                    + "Generated: " + data.getGeneratedAt() + " · Records: " + data.getRows().size()
                    + (blank(data.getPreparedBy()) ? "" : " · Report prepared by: " + data.getPreparedBy() + " (Faculty)"));
            sheet.getRow(4).createCell(1).setCellValue(String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                    data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList()));

            int rowCursor = 6;
            if (data.getSummary() != null && !data.getSummary().isEmpty()) {
                for (int i = 0; i < data.getSummary().size(); i += 3) {
                    Row summaryRow = sheet.createRow(rowCursor++);
                    for (int metricIndex = i; metricIndex < Math.min(i + 3, data.getSummary().size()); metricIndex++) {
                        int cellIndex = (metricIndex - i) * 2;
                        var metric = data.getSummary().get(metricIndex);
                        Cell label = summaryRow.createCell(cellIndex);
                        label.setCellValue(metric.getLabel());
                        label.setCellStyle(metricLabelStyle);
                        summaryRow.createCell(cellIndex + 1).setCellValue(metric.getValue());
                    }
                }
                rowCursor++;
            }
            int mainHeaderRow = rowCursor;
            Row headerRow = sheet.createRow(mainHeaderRow);
            headerRow.setHeightInPoints(30);
            for (int column = 0; column < data.getColumns().size(); column++) {
                Cell cell = headerRow.createCell(column);
                cell.setCellValue(data.getColumns().get(column));
                cell.setCellStyle(headerStyle);
            }
            CellStyle wrappedCellStyle = workbook.createCellStyle();
            wrappedCellStyle.setWrapText(true);
            CellStyle alternateRowStyle = workbook.createCellStyle();
            alternateRowStyle.setWrapText(true);
            alternateRowStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            alternateRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            CellStyle lowAttendanceStyle = workbook.createCellStyle();
            lowAttendanceStyle.setWrapText(true);
            lowAttendanceStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            lowAttendanceStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            CellStyle incompleteStyle = workbook.createCellStyle();
            incompleteStyle.setWrapText(true);
            incompleteStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            incompleteStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            int mainDataStart = mainHeaderRow + 1;
            for (int rowIndex = 0; rowIndex < data.getRows().size(); rowIndex++) {
                Row row = sheet.createRow(mainDataStart + rowIndex);
                row.setHeightInPoints(28);
                List<String> values = data.getRows().get(rowIndex);
                for (int column = 0; column < data.getColumns().size(); column++) {
                    Cell cell = row.createCell(column);
                    cell.setCellValue(column < values.size() ? values.get(column) : "");
                    cell.setCellStyle(wrappedCellStyle);
                    String flag = data.getColumns().contains("Attendance Flag") && values.size() > data.getColumns().indexOf("Attendance Flag")
                            ? values.get(data.getColumns().indexOf("Attendance Flag")) : "";
                    if (flag.equals("Low Attendance")) cell.setCellStyle(lowAttendanceStyle);
                    else if (flag.equals("Incomplete")) cell.setCellStyle(incompleteStyle);
                    else if (rowIndex % 2 == 1) cell.setCellStyle(alternateRowStyle);
                }
            }
            for (int column = 0; column < data.getColumns().size(); column++) {
                String heading = data.getColumns().get(column).toLowerCase(Locale.ROOT);
                int width = heading.contains("email") ? 36 : heading.equals("student") || heading.contains("faculty name") || heading.equals("faculty") ? 32
                        : data.getColumns().contains("Attendance Flag") && column == 6 ? 32
                        : heading.contains("subject") ? 28 : heading.contains("phone") ? 18
                        : heading.contains("attendance flag") ? 22 : heading.contains("grade") ? 14 : heading.contains("section") ? 12
                        : heading.contains("time") ? 12 : heading.contains("attendance rate") ? 20 : 15;
                sheet.setColumnWidth(column, width * 256);
            }
            int mainDataEnd = mainDataStart + data.getRows().size() - 1;
            if (!data.getRows().isEmpty()) sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(mainHeaderRow, mainDataEnd, 0, data.getColumns().size() - 1));
            int sectionCursor = mainDataStart + data.getRows().size() + 2;
            if (data.getSections() != null) {
                for (ReportData.ReportSection section : data.getSections()) {
                    Row sectionTitleRow = sheet.createRow(sectionCursor++);
                    sectionTitleRow.createCell(0).setCellValue(section.getTitle());
                    sectionTitleRow.getCell(0).setCellStyle(sectionStyle);
                    sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(sectionTitleRow.getRowNum(), sectionTitleRow.getRowNum(), 0, Math.max(0, section.getColumns().size() - 1)));
                    Row sectionHeader = sheet.createRow(sectionCursor++);
                    sectionHeader.setHeightInPoints(30);
                    for (int column = 0; column < section.getColumns().size(); column++) {
                        Cell cell = sectionHeader.createCell(column);
                        cell.setCellValue(section.getColumns().get(column));
                        cell.setCellStyle(headerStyle);
                    }
                    for (int rowIndex = 0; rowIndex < section.getRows().size(); rowIndex++) {
                        Row row = sheet.createRow(sectionCursor++);
                        row.setHeightInPoints(40);
                        List<String> values = section.getRows().get(rowIndex);
                        for (int column = 0; column < section.getColumns().size(); column++) {
                            Cell cell = row.createCell(column);
                            cell.setCellValue(column < values.size() ? values.get(column) : "");
                            cell.setCellStyle(rowIndex % 2 == 1 ? alternateRowStyle : wrappedCellStyle);
                        }
                    }
                    sectionCursor += 1;
                }
            }
            embedExcelLogo(workbook, sheet, data.getSchool().getLogoUrl());
            sheet.createFreezePane(0, mainHeaderRow + 1);
            sheet.getPrintSetup().setLandscape(true);
            sheet.getPrintSetup().setFitWidth((short) 1);
            sheet.getPrintSetup().setFitHeight((short) 0);
            sheet.setFitToPage(true);
            sheet.setAutobreaks(true);
            // Keep one worksheet for both tables; repeating the student header above the audit would be misleading.
            int printColumnCount = data.getColumns().size();
            if (data.getSections() != null) for (ReportData.ReportSection section : data.getSections()) printColumnCount = Math.max(printColumnCount, section.getColumns().size());
            workbook.setPrintArea(0, 0, Math.max(printColumnCount, 1) - 1, 0, Math.max(sectionCursor - 1, mainHeaderRow));
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
        if (columns.size() == 6 && columns.get(0).equalsIgnoreCase("Student")) return new float[]{0.27f, 0.24f, 0.13f, 0.12f, 0.10f, 0.14f};
        if (columns.size() == 6 && columns.get(0).toLowerCase(Locale.ROOT).contains("faculty")) return new float[]{0.27f, 0.23f, 0.13f, 0.20f, 0.09f, 0.08f};
        if (columns.contains("Attendance Flag")) {
            float[] weights = {1.45f, 2.4f, 0.8f, 0.65f, 0.65f, 0.58f, 0.58f, 0.58f, 0.65f, 0.65f, 0.95f, 1.0f};
            return normalizeRatios(weights, columns.size());
        }
        if (columns.contains("Faculty") && columns.contains("Start Time")) {
            float[] weights = {0.75f, 0.55f, 0.55f, 0.75f, 0.6f, 0.75f, 1.15f, 0.55f, 0.55f, 0.55f, 0.55f, 0.55f, 0.65f, 0.75f};
            return normalizeRatios(weights, columns.size());
        }
        float ratio = 1f / Math.max(1, columns.size());
        float[] widths = new float[columns.size()];
        Arrays.fill(widths, ratio);
        return widths;
    }

    private float[] normalizeRatios(float[] weights, int size) {
        float total = 0f;
        for (float weight : weights) total += weight;
        float[] ratios = new float[size];
        for (int i = 0; i < size; i++) ratios[i] = weights[i] / total;
        return ratios;
    }

    private boolean isNameColumn(String column) {
        String normalized = column == null ? "" : column.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("student") || normalized.equals("faculty") || normalized.equals("faculty name");
    }

    private void drawFitText(PDPageContentStream stream, PDType1Font font, float preferredSize, float minimumSize,
                             float x, float y, String value, Color color, float maxWidth) throws Exception {
        String text = sanitizePdfText(value);
        float size = preferredSize;
        while (size > minimumSize && font.getStringWidth(text) / 1000f * size > maxWidth) size -= 0.25f;
        if (font.getStringWidth(text) / 1000f * size > maxWidth) {
            size = minimumSize;
            text = truncate(text, Math.max(1, (int) (maxWidth / (font.getStringWidth("M") / 1000f * size))));
        }
        stream.beginText();
        stream.setFont(font, size);
        stream.setNonStrokingColor(color);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
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
