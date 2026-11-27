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
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
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
            filterDescription = isFaculty ? "All assigned grades and sections" : "All grades and sections";
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


    public ReportData getTimetableReport(Long academicYearId, Long gradeId, Long sectionId, Long facultyId,
                                         String dayOfWeek, String classType, String status, String activeFilter) {
        User actor = userService.getPrincipal();
        boolean isAdmin = hasRole(actor, RoleName.ROLE_ADMIN);
        boolean isFaculty = hasRole(actor, RoleName.ROLE_FACULTY);
        if (!isAdmin && !isFaculty) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Timetable reports are available to administrators and faculty.");
        }

        AcademicYear selectedYear = academicYearId == null ? null : resolveAcademicYear(academicYearId);
        if (isFaculty && facultyId != null && !facultyId.equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty may only view their own timetable.");
        }
        Grade selectedGrade = gradeId == null ? null : gradeRepository.findById(gradeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found."));
        if (selectedGrade != null && selectedYear != null && !selectedGrade.getAcademicYear().getId().equals(selectedYear.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected grade does not belong to the selected academic year.");
        }
        Section selectedSection = sectionId == null ? null : sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found."));
        if (selectedSection != null && selectedGrade != null && !selectedSection.getGrade().getId().equals(selectedGrade.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected grade.");
        }
        if (selectedSection != null && selectedYear != null && !selectedSection.getGrade().getAcademicYear().getId().equals(selectedYear.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected section does not belong to the selected academic year."
            );
        }

        String day = dayOfWeek == null || dayOfWeek.isBlank() ? "ALL" : dayOfWeek.trim().toUpperCase(Locale.ROOT);
        if (!day.equals("ALL")) {
            try { java.time.DayOfWeek.valueOf(day); }
            catch (IllegalArgumentException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid weekday filter."); }
        }
        String type = classType == null || classType.isBlank() ? "ALL" : classType.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ALL", "ONLINE", "OFFLINE").contains(type)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid class type filter.");
        String scheduleStatus = status == null || status.isBlank() ? (isFaculty ? "APPROVED" : "ALL") : status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED").contains(scheduleStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid timetable status filter.");
        }
        String active = activeFilter == null || activeFilter.isBlank() ? "ALL" : activeFilter.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ALL", "ACTIVE", "INACTIVE").contains(active)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid active filter.");

        List<Timetable> schedules = timetableRepository.findAll().stream()
                .filter(item -> selectedYear == null || item.getAcademicYear().getId().equals(selectedYear.getId()))
                .filter(item -> gradeId == null || item.getGrade().getId().equals(gradeId))
                .filter(item -> sectionId == null || item.getSection().getId().equals(sectionId))
                .filter(item -> !isFaculty || item.getFaculty().getId().equals(actor.getId()))
                .filter(item -> isFaculty || facultyId == null || item.getFaculty().getId().equals(facultyId))
                .filter(item -> day.equals("ALL") || item.getDayOfWeek().name().equals(day))
                .filter(item -> type.equals("ALL") || item.getClassType().name().equals(type))
                .filter(item -> scheduleStatus.equals("ALL") || item.getStatus().name().equals(scheduleStatus))
                .filter(item -> active.equals("ALL") || (active.equals("ACTIVE") ? item.isActive() : !item.isActive()))
                .sorted(Comparator.comparing((Timetable t) -> t.getDayOfWeek().getValue())
                        .thenComparing(Timetable::getStartTime)
                        .thenComparing(t -> t.getGrade().getName())
                        .thenComparing(t -> t.getSection().getName())
                        .thenComparing(t -> t.getSubject().getName()))
                .toList();

        // Timetable details are presented only in weekday sections; the main report page is summary-only.
        List<String> columns = List.of();
        List<List<String>> rows = List.of();

        List<ReportData.ReportSection> daySections = java.util.Arrays.stream(java.time.DayOfWeek.values())
                .filter(d -> (day.equals("ALL") || d.name().equals(day)) && schedules.stream().anyMatch(item -> item.getDayOfWeek() == d))
                .map(d -> ReportData.ReportSection.builder().title(d.name())
                        .columns(List.of("Time", "Grade / Section", "Subject", "Faculty", "Class Type", "Room / Meeting", "Approval Status", "Activity", "Valid From", "Valid Until"))
                        .rows(schedules.stream().filter(item -> item.getDayOfWeek() == d).map(item -> List.of(
                                formatTimetableTime(item.getStartTime()) + " – " + formatTimetableTime(item.getEndTime()),
                                safe(item.getGrade().getName()) + " / " + safe(item.getSection().getName()),
                                safe(item.getSubject().getName()), safe(item.getFaculty().getFullName()), item.getClassType().name(),
                                item.getClassType() == ClassType.ONLINE ? safe(blank(item.getMeetingLink()) ? (item.getMeetingPlatform() == null ? "" : item.getMeetingPlatform().name()) : item.getMeetingLink()) : safe(item.getRoom()),
                                item.getStatus().name(), item.isActive() ? "Active" : "Inactive",
                                formatTimetableDate(String.valueOf(item.getStartDate())), formatTimetableDate(String.valueOf(item.getEndDate()))
                        )).toList()).build()).toList();

        long activeCount = schedules.stream().filter(Timetable::isActive).count();
        long approvedCount = schedules.stream().filter(item -> item.getStatus() == TimetableStatus.APPROVED).count();
        long onlineCount = schedules.stream().filter(item -> item.getClassType() == ClassType.ONLINE).count();
        long offlineCount = schedules.size() - onlineCount;
        List<ReportData.SummaryMetric> metrics = List.of(
                metric("Schedules", String.valueOf(schedules.size())),
                metric("Approved", String.valueOf(approvedCount)),
                metric("Active", String.valueOf(activeCount)),
                metric("Inactive", String.valueOf(schedules.size() - activeCount)),
                metric("Online", String.valueOf(onlineCount)),
                metric("Offline", String.valueOf(offlineCount))
        );
        String facultyFilter = isFaculty ? safe(actor.getFullName())
                : facultyId == null ? "All Faculty"
                : userRepository.findById(facultyId).map(User::getFullName).orElse("Selected Faculty");
        String filterText = (selectedYear == null ? "All Academic Years" : selectedYear.getName())
                + " · Grade: " + (selectedGrade == null ? "All Grades" : selectedGrade.getName())
                + " · Section: " + (selectedSection == null ? "All Sections" : selectedSection.getName())
                + " · Faculty: " + facultyFilter
                + " · Day: " + (day.equals("ALL") ? "All Days" : day)
                + " · Type: " + type + " · Status: " + scheduleStatus + " · Active: " + active;
        return buildReport(isFaculty ? "My Timetable Report" : "Timetable Report",
                selectedYear == null ? "All Academic Years" : selectedYear.getName(), columns, rows, filterText, metrics, daySections);
    }

    public byte[] exportTimetableReport(Long academicYearId, Long gradeId, Long sectionId, Long facultyId,
                                       String dayOfWeek, String classType, String status, String activeFilter, String format) {
        return export(getTimetableReport(academicYearId, gradeId, sectionId, facultyId, dayOfWeek, classType, status, activeFilter), format);
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
        else filterText += isFaculty ? " · All assigned grades and sections" : " · All grades and sections";
        if (!status.equals("ALL")) filterText += " · Student status: " + status;

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

    public ReportData buildCustomReport(String title, String year, List<String> columns, List<List<String>> rows, String subtitle,
                                        List<ReportData.SummaryMetric> summary, List<ReportData.ReportSection> sections) {
        return buildReport(title, year, columns, rows, subtitle, summary, sections);
    }

    public byte[] exportCustomReport(ReportData data, String format) {
        return export(data, format);
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
        if (isTimetableReport(data)) return createTimetablePdf(data);
        boolean classStrengthReport = data.getReportTitle() != null && data.getReportTitle().startsWith("My Class Strength & Student Roster");
        List<String> pdfMainColumns = data.getColumns();
        List<List<String>> pdfMainRows = data.getRows();
        if (classStrengthReport && data.getSections() != null) {
            pdfMainColumns = List.of("Grade", "Section", "Student ID", "Student Name", "Email", "Phone");
            List<List<String>> rosterRows = new ArrayList<>();
            for (ReportData.ReportSection section : data.getSections()) {
                String sectionTitle = section.getTitle();
                String gradeLabel = sectionTitle.contains(" · Section ") ? sectionTitle.substring(0, sectionTitle.indexOf(" · Section ")) : "";
                String sectionLabel = sectionTitle.contains(" · Section ") ? sectionTitle.substring(sectionTitle.indexOf(" · Section ") + 11).replace(" Active Student Roster", "") : "";
                for (List<String> student : section.getRows()) {
                    rosterRows.add(List.of(gradeLabel, sectionLabel,
                            student.size() > 0 ? student.get(0) : "",
                            student.size() > 1 ? student.get(1) : "",
                            student.size() > 2 ? student.get(2) : "",
                            student.size() > 3 ? student.get(3) : ""));
                }
            }
            pdfMainRows = rosterRows;
        }
        final List<String> pdfColumns = pdfMainColumns;
        final List<List<String>> pdfRows = pdfMainRows;
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            int mainRowsPerPage = pdfColumns.size() >= 8 ? 30 : 32;
            int mainPages = Math.max(1, (int) Math.ceil(pdfRows.size() / (double) mainRowsPerPage));
            boolean compactAttendanceAudit = !classStrengthReport
                    && data.getReportTitle() != null && data.getReportTitle().startsWith("Attendance Report")
                    && data.getSections() != null && data.getSections().size() == 1
                    && data.getSections().get(0).getRows().size() <= 6
                    && pdfRows.size() <= 25;
            boolean academicPerformanceReport = data.getReportTitle() != null && data.getReportTitle().startsWith("Academic Performance Report");
            boolean compactAcademicDistribution = academicPerformanceReport && data.getSections() != null
                    && data.getSections().size() == 1 && data.getSections().get(0).getRows().size() <= 4 && pdfRows.size() <= 25;
            int sectionPages = classStrengthReport || compactAttendanceAudit || compactAcademicDistribution || data.getSections() == null ? 0 : data.getSections().stream()
                    .mapToInt(section -> Math.max(1, (int) Math.ceil(section.getRows().size() / 32.0))).sum();
            int totalPages = mainPages + sectionPages;
            int pageNumber = 0;

            for (int pageIndex = 0; pageIndex < mainPages; pageIndex++) {
                PDRectangle pageSize = pdfColumns.size() >= 8 ? new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()) : PDRectangle.A4;
                PDPage page = new PDPage(pageSize);
                document.addPage(page);
                pageNumber++;
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    float margin = 32;
                    float pageWidth = page.getMediaBox().getWidth();
                    float usableWidth = pageWidth - margin * 2;
                    float y = page.getMediaBox().getHeight() - margin;
                    // Reuse the report-level academicPerformanceReport flag.
                    float logoAreaWidth = 76f;
                    drawSchoolLogo(document, stream, data.getSchool().getLogoUrl(), pageWidth - margin - 48, y - 34);
                    drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14, 9,
                            margin, y, data.getSchool().getName(), color(data.getSchool().getPrimaryColor()), usableWidth - logoAreaWidth);
                    y -= 17;
                    if (!blank(data.getSchool().getTagline())) {
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, 6.5f, margin, y,
                                data.getSchool().getTagline(), Color.DARK_GRAY, usableWidth - logoAreaWidth);
                        y -= 12;
                    }
                    if (academicPerformanceReport) {
                        String reportSubtitle = data.getReportTitle().replaceFirst("^Academic Performance Report\\s*[·-]?\\s*", "");
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11,
                                margin, y, "Academic Performance Report", Color.BLACK);
                        y -= 14;
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8, 6.5f,
                                margin, y, reportSubtitle, Color.DARK_GRAY, usableWidth);
                        y -= 12;
                    } else {
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11, 7,
                                margin, y, data.getReportTitle(), Color.BLACK, usableWidth - logoAreaWidth);
                        y -= 15;
                    }
                    String metadata = (blank(data.getAcademicYear()) ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                            + "Generated: " + data.getGeneratedAt() + " · Records: " + pdfRows.size();
                    drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, 6, margin, y,
                            metadata, Color.DARK_GRAY, usableWidth);
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
                    float rowHeight = classStrengthReport ? 20 : pdfColumns.size() >= 8 ? 12.5f : 17;
                    float[] columnRatios = pdfColumnRatios(pdfColumns);
                    float[] columnWidths = new float[pdfColumns.size()];
                    for (int col = 0; col < columnWidths.length; col++) columnWidths[col] = usableWidth * columnRatios[col];
                    stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                    stream.addRect(margin, y - headerHeight + 3, usableWidth, headerHeight);
                    stream.fill();
                    float headerFontSize = pdfColumns.size() >= 8 ? 6.5f : 7.5f;
                    for (int col = 0; col < pdfColumns.size(); col++) {
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), headerFontSize, 4.5f,
                                margin + pdfColumnOffset(columnWidths, col) + 3, y - 10,
                                pdfColumns.get(col), Color.WHITE, columnWidths[col] - 6);
                    }
                    y -= headerHeight;
                    int start = pageIndex * mainRowsPerPage;
                    int end = Math.min(pdfRows.size(), start + mainRowsPerPage);
                    for (int rowIndex = start; rowIndex < end; rowIndex++) {
                        List<String> row = pdfRows.get(rowIndex);
                        String attendanceFlag = pdfColumns.contains("Attendance Flag") && row.size() > pdfColumns.indexOf("Attendance Flag")
                                ? row.get(pdfColumns.indexOf("Attendance Flag")) : "";
                        Color rowBackground = attendanceFlag.equals("Low Attendance") ? new Color(255, 235, 235)
                                : attendanceFlag.equals("Incomplete") ? new Color(255, 247, 220)
                                : rowIndex % 2 == 1 ? new Color(245, 247, 250) : null;
                        if (rowBackground != null) {
                            stream.setNonStrokingColor(rowBackground);
                            stream.addRect(margin, y - rowHeight + 3, usableWidth, rowHeight);
                            stream.fill();
                        }
                        for (int col = 0; col < pdfColumns.size(); col++) {
                            String value = col < row.size() ? row.get(col) : "";
                            if (isNameColumn(pdfColumns.get(col))) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7, 5.0f,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9, value, Color.BLACK, columnWidths[col] - 6);
                            } else if (pdfColumns.get(col).equalsIgnoreCase("Student ID")) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6.5f, 5.0f,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9, value, Color.BLACK, columnWidths[col] - 6);
                            } else if (pdfColumns.get(col).equalsIgnoreCase("Email")) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6, 4.25f,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9, value, Color.BLACK, columnWidths[col] - 6);
                            } else {
                                drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), pdfColumns.size() >= 8 ? 6 : 7,
                                        margin + pdfColumnOffset(columnWidths, col) + 3, y - 9,
                                        truncate(value, pdfTextLimit(columnWidths[col])), Color.BLACK);
                            }
                        }
                        y -= rowHeight;
                    }
                    if (compactAttendanceAudit && pageIndex == 0) {
                        ReportData.ReportSection audit = data.getSections().get(0);
                        if (y > 180) {
                            drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9,
                                    margin, y - 1, audit.getTitle(), Color.BLACK);
                            y -= 15;
                            float auditHeaderHeight = 17;
                            float auditRowHeight = 11;
                            float[] auditRatios = pdfColumnRatios(audit.getColumns());
                            float[] auditWidths = new float[auditRatios.length];
                            for (int col = 0; col < auditWidths.length; col++) auditWidths[col] = usableWidth * auditRatios[col];
                            stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                            stream.addRect(margin, y - auditHeaderHeight + 3, usableWidth, auditHeaderHeight);
                            stream.fill();
                            for (int col = 0; col < audit.getColumns().size(); col++) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 5.8f, 4.0f,
                                        margin + pdfColumnOffset(auditWidths, col) + 2, y - 9,
                                        audit.getColumns().get(col), Color.WHITE, auditWidths[col] - 4);
                            }
                            y -= auditHeaderHeight;
                            for (int rowIndex = 0; rowIndex < audit.getRows().size(); rowIndex++) {
                                List<String> auditRow = audit.getRows().get(rowIndex);
                                if (rowIndex % 2 == 1) {
                                    stream.setNonStrokingColor(new Color(245, 247, 250));
                                    stream.addRect(margin, y - auditRowHeight + 2, usableWidth, auditRowHeight);
                                    stream.fill();
                                }
                                for (int col = 0; col < audit.getColumns().size(); col++) {
                                    String value = col < auditRow.size() ? auditRow.get(col) : "";
                                    drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 5.6f, 4.0f,
                                            margin + pdfColumnOffset(auditWidths, col) + 2, y - 7,
                                            value, Color.BLACK, auditWidths[col] - 4);
                                }
                                y -= auditRowHeight;
                            }
                        }
                    }
                    if (compactAcademicDistribution && pageIndex == mainPages - 1) {
                        ReportData.ReportSection distribution = data.getSections().get(0);
                        y -= 8;
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9,
                                margin, y, distribution.getTitle(), Color.BLACK);
                        y -= 14;
                        float sectionHeaderHeight = 16;
                        float sectionRowHeight = 13;
                        float[] sectionRatios = pdfColumnRatios(distribution.getColumns());
                        float[] sectionWidths = new float[sectionRatios.length];
                        for (int col = 0; col < sectionWidths.length; col++) sectionWidths[col] = usableWidth * sectionRatios[col];
                        stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                        stream.addRect(margin, y - sectionHeaderHeight + 3, usableWidth, sectionHeaderHeight);
                        stream.fill();
                        for (int col = 0; col < distribution.getColumns().size(); col++) {
                            drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 6.5f, 5,
                                    margin + pdfColumnOffset(sectionWidths, col) + 3, y - 9,
                                    distribution.getColumns().get(col), Color.WHITE, sectionWidths[col] - 6);
                        }
                        y -= sectionHeaderHeight;
                        for (int rowIndex = 0; rowIndex < distribution.getRows().size(); rowIndex++) {
                            List<String> sectionRow = distribution.getRows().get(rowIndex);
                            if (rowIndex % 2 == 1) {
                                stream.setNonStrokingColor(new Color(245, 247, 250));
                                stream.addRect(margin, y - sectionRowHeight + 2, usableWidth, sectionRowHeight);
                                stream.fill();
                            }
                            for (int col = 0; col < distribution.getColumns().size(); col++) {
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6.5f, 5,
                                        margin + pdfColumnOffset(sectionWidths, col) + 3, y - 8,
                                        col < sectionRow.size() ? sectionRow.get(col) : "", Color.BLACK, sectionWidths[col] - 6);
                            }
                            y -= sectionRowHeight;
                        }
                    }
                    drawPdfFooter(stream, pageWidth, margin, pageNumber, totalPages, data);
                }
            }

            if (!classStrengthReport && !compactAttendanceAudit && !compactAcademicDistribution && data.getSections() != null) {
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
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), headerSize, 4.5f,
                                        margin + pdfColumnOffset(widths, col) + 3, y - 10,
                                        section.getColumns().get(col), Color.WHITE, widths[col] - 6);
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
                                    } else if (section.getColumns().get(col).equalsIgnoreCase("Email")) {
                                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 6, 4.25f,
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

    private boolean isTimetableReport(ReportData data) {
        return data.getReportTitle() != null && (data.getReportTitle().startsWith("Timetable Report") || data.getReportTitle().startsWith("My Timetable Report"));
    }

    private static String formatTimetableTime(Object value) {
        if (value == null) return "";
        String text = value.toString();
        try { return java.time.LocalTime.parse(text).format(DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH)); }
        catch (Exception ignored) { return text; }
    }

    private List<String> wrapPdfCell(String text, int maxChars) {
        String value = safe(text);
        if (value.isBlank()) return List.of("");
        int limit = Math.max(8, maxChars);
        List<String> lines = new ArrayList<>();
        String remaining = value;
        while (remaining.length() > limit) {
            int breakAt = remaining.lastIndexOf(' ', limit);
            if (breakAt <= 0) {
                breakAt = Math.min(limit, remaining.length());
                for (int i = breakAt - 1; i >= Math.max(0, limit - 8); i--) {
                    if (remaining.charAt(i) == '/' || remaining.charAt(i) == '-' || remaining.charAt(i) == '?' || remaining.charAt(i) == '&') {
                        breakAt = i + 1; break;
                    }
                }
            }
            lines.add(remaining.substring(0, breakAt));
            remaining = remaining.substring(breakAt).trim();
        }
        if (!remaining.isEmpty()) lines.add(remaining);
        return lines;
    }

    private byte[] createTimetablePdf(ReportData data) throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            List<ReportData.ReportSection> sections = data.getSections() == null ? List.of() : data.getSections();
            PDRectangle pageSize = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
            float margin = 34f;
            float usableWidth = pageSize.getWidth() - margin * 2;
            float[] ratios = {0.105f, 0.10f, 0.135f, 0.105f, 0.07f, 0.20f, 0.09f, 0.08f, 0.0575f, 0.0575f};
            int pageNumber = 0;
            int totalPages = Math.max(1, sections.size());
            for (int sectionIndex = 0; sectionIndex < sections.size(); sectionIndex++) {
                ReportData.ReportSection section = sections.get(sectionIndex);
                int rowsPerPage = sectionIndex == 0 ? 8 : 12;
                int pages = Math.max(1, (int) Math.ceil(section.getRows().size() / (double) rowsPerPage));
                totalPages += pages - 1;
                for (int p = 0; p < pages; p++) {
                    PDPage page = new PDPage(pageSize);
                    document.addPage(page);
                    pageNumber++;
                    try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                        float y = pageSize.getHeight() - margin;
                        drawSchoolLogo(document, stream, data.getSchool().getLogoUrl(), pageSize.getWidth() - margin - 48, y - 34);
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16, 11,
                                margin, y, data.getSchool().getName(), color(data.getSchool().getPrimaryColor()), usableWidth - 65);
                        y -= 22;
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12, 9,
                                margin, y, "Timetable Report", Color.BLACK, usableWidth);
                        y -= 16;
                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8.5f, 7,
                                margin, y, "Academic Year: " + safe(data.getAcademicYear()) + "  |  Generated: " + safe(data.getGeneratedAt()),
                                Color.DARK_GRAY, usableWidth);
                        y -= 13;
                        String filters = timetableFilterSummary(data.getReportTitle());
                        if (!blank(filters)) {
                            drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7.8f, 6.5f,
                                    margin, y, "Filters: " + filters, Color.DARK_GRAY, usableWidth);
                            y -= 14;
                        }
                        // Restore the standard report's compact summary points above the data, not a separate cover.
                        if (sectionIndex == 0 && p == 0 && data.getSummary() != null && !data.getSummary().isEmpty()) {
                            for (int i = 0; i < data.getSummary().size(); i += 3) {
                                String line = data.getSummary().subList(i, Math.min(i + 3, data.getSummary().size())).stream()
                                        .map(metric -> metric.getLabel() + ": " + metric.getValue())
                                        .collect(java.util.stream.Collectors.joining("   |   "));
                                drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 8, 6.8f,
                                        margin, y, line, Color.DARK_GRAY, usableWidth);
                                y -= 12;
                            }
                            y -= 3;
                        }
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13,
                                margin, y, section.getTitle(), color(data.getSchool().getPrimaryColor()));
                        y -= 18;
                        float headerHeight = 22f;
                        float[] widths = new float[section.getColumns().size()];
                        for (int c = 0; c < widths.length; c++) widths[c] = usableWidth * ratios[Math.min(c, ratios.length - 1)];
                        stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                        stream.addRect(margin, y - headerHeight + 3, usableWidth, headerHeight);
                        stream.fill();
                        for (int c = 0; c < section.getColumns().size(); c++) {
                            drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7.2f, 5.5f,
                                    margin + pdfColumnOffset(widths, c) + 3, y - 10,
                                    section.getColumns().get(c), Color.WHITE, widths[c] - 6);
                        }
                        y -= headerHeight;
                        int startRow = p * rowsPerPage, endRow = Math.min(section.getRows().size(), startRow + rowsPerPage);
                        for (int r = startRow; r < endRow; r++) {
                            List<String> row = section.getRows().get(r);
                            float rowHeight = 31f;
                            if (r % 2 == 1) {
                                stream.setNonStrokingColor(new Color(244, 247, 251));
                                stream.addRect(margin, y - rowHeight + 3, usableWidth, rowHeight);
                                stream.fill();
                            }
                            for (int c = 0; c < section.getColumns().size(); c++) {
                                String value = c < row.size() ? row.get(c) : "";
                                float x = margin + pdfColumnOffset(widths, c) + 3;
                                float cellWidth = widths[c] - 6;
                                if (c == 5 && isHttpUrl(value)) {
                                    drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7.5f, 6,
                                            x, y - 17, meetingDisplayLabel(value), new Color(28, 92, 166), cellWidth);
                                    PDAnnotationLink annotation = new PDAnnotationLink();
                                    annotation.setRectangle(new PDRectangle(x, y - rowHeight + 4, cellWidth, rowHeight - 5));
                                    PDActionURI action = new PDActionURI(); action.setURI(value); annotation.setAction(action);
                                    page.getAnnotations().add(annotation);
                                } else {
                                    String display = (c == 8 || c == 9) ? formatTimetableDate(value) : value;
                                    List<String> lines = wrapPdfCell(display, Math.max(7, (int) (cellWidth / 4.0f)));
                                    for (int line = 0; line < Math.min(2, lines.size()); line++) {
                                        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 7.2f, 5.5f,
                                                x, y - 10 - line * 8.5f, lines.get(line), Color.BLACK, cellWidth);
                                    }
                                }
                            }
                            y -= rowHeight;
                        }
                        drawPdfFooter(stream, pageSize.getWidth(), margin, pageNumber, totalPages, data);
                    }
                }
            }
            if (sections.isEmpty()) {
                PDPage page = new PDPage(pageSize); document.addPage(page);
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14, margin, pageSize.getHeight() - margin, "No timetable entries found.", Color.BLACK);
                    drawPdfFooter(stream, pageSize.getWidth(), margin, 1, 1, data);
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] createTimetableExcel(ReportData data) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            String primary = validColor(data.getSchool().getPrimaryColor(), DEFAULT_PRIMARY);
            String accent = validColor(data.getSchool().getAccentColor(), DEFAULT_ACCENT);
            List<ReportData.ReportSection> sections = data.getSections() == null ? List.of() : data.getSections();

            CellStyle schoolStyle = workbook.createCellStyle();
            Font schoolFont = workbook.createFont();
            schoolFont.setBold(true); schoolFont.setFontHeightInPoints((short) 16);
            schoolFont.setColor(toXssfColor(workbook, primary));
            schoolStyle.setFont(schoolFont); schoolStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true); titleFont.setFontHeightInPoints((short) 12);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);
            ((XSSFCellStyle) titleStyle).setFillForegroundColor(toXssfColor(workbook, primary));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setAlignment(HorizontalAlignment.LEFT);

            CellStyle metadataStyle = workbook.createCellStyle();
            metadataStyle.setWrapText(true); metadataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Font metadataFont = workbook.createFont(); metadataFont.setFontHeightInPoints((short) 9);
            metadataFont.setColor(toXssfColor(workbook, "475569")); metadataStyle.setFont(metadataFont);
            ((XSSFCellStyle) metadataStyle).setFillForegroundColor(toXssfColor(workbook, "F1F5F9"));
            metadataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle filterStyle = workbook.createCellStyle();
            filterStyle.cloneStyleFrom(metadataStyle);
            Font filterFont = workbook.createFont(); filterFont.setFontHeightInPoints((short) 9);
            filterFont.setColor(toXssfColor(workbook, "64748B")); filterStyle.setFont(filterFont);
            ((XSSFCellStyle) filterStyle).setFillForegroundColor(toXssfColor(workbook, "F8FAFC"));

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setWrapText(true); headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            ((XSSFCellStyle) headerStyle).setBottomBorderColor(toXssfColor(workbook, accent));
            Font headerFont = workbook.createFont(); headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 10);
            headerFont.setColor(IndexedColors.WHITE.getIndex()); headerStyle.setFont(headerFont);
            ((XSSFCellStyle) headerStyle).setFillForegroundColor(toXssfColor(workbook, primary));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle bodyStyle = workbook.createCellStyle();
            bodyStyle.setWrapText(true); bodyStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            bodyStyle.setBorderBottom(BorderStyle.THIN);
            ((XSSFCellStyle) bodyStyle).setBottomBorderColor(toXssfColor(workbook, "E2E8F0"));
            Font bodyFont = workbook.createFont(); bodyFont.setFontHeightInPoints((short) 10);
            bodyStyle.setFont(bodyFont);

            CellStyle alternateStyle = workbook.createCellStyle(); alternateStyle.cloneStyleFrom(bodyStyle);
            ((XSSFCellStyle) alternateStyle).setFillForegroundColor(toXssfColor(workbook, "F8FAFC"));
            alternateStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle linkStyle = workbook.createCellStyle(); linkStyle.cloneStyleFrom(bodyStyle);
            Font linkFont = workbook.createFont(); linkFont.setFontHeightInPoints((short) 10);
            linkFont.setColor(toXssfColor(workbook, "2563EB")); linkFont.setUnderline(Font.U_SINGLE);
            linkStyle.setFont(linkFont);

            CellStyle statusApproved = workbook.createCellStyle(); statusApproved.cloneStyleFrom(bodyStyle);
            ((XSSFCellStyle) statusApproved).setFillForegroundColor(toXssfColor(workbook, "DCFCE7"));
            statusApproved.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font approvedFont = workbook.createFont(); approvedFont.setBold(true); approvedFont.setColor(toXssfColor(workbook, "166534"));
            statusApproved.setFont(approvedFont);

            CellStyle statusPending = workbook.createCellStyle(); statusPending.cloneStyleFrom(bodyStyle);
            ((XSSFCellStyle) statusPending).setFillForegroundColor(toXssfColor(workbook, "FEF3C7"));
            statusPending.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font pendingFont = workbook.createFont(); pendingFont.setBold(true); pendingFont.setColor(toXssfColor(workbook, "92400E"));
            statusPending.setFont(pendingFont);

            CellStyle statusOther = workbook.createCellStyle(); statusOther.cloneStyleFrom(bodyStyle);
            ((XSSFCellStyle) statusOther).setFillForegroundColor(toXssfColor(workbook, "FEE2E2"));
            statusOther.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font otherFont = workbook.createFont(); otherFont.setBold(true); otherFont.setColor(toXssfColor(workbook, "991B1B"));
            statusOther.setFont(otherFont);

            CellStyle activeStyle = workbook.createCellStyle(); activeStyle.cloneStyleFrom(bodyStyle);
            ((XSSFCellStyle) activeStyle).setFillForegroundColor(toXssfColor(workbook, "E0F2FE"));
            activeStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font activeFont = workbook.createFont(); activeFont.setBold(true); activeFont.setColor(toXssfColor(workbook, "075985"));
            activeStyle.setFont(activeFont);

            CellStyle inactiveStyle = workbook.createCellStyle(); inactiveStyle.cloneStyleFrom(bodyStyle);
            Font inactiveFont = workbook.createFont(); inactiveFont.setColor(toXssfColor(workbook, "64748B"));
            inactiveStyle.setFont(inactiveFont);

            int[] widths = {19, 20, 28, 22, 14, 29, 22, 14, 16, 16};
            for (ReportData.ReportSection section : sections) {
                String sheetName = section.getTitle().replaceAll("[\\\\/?*\\[\\]:]", " ").trim();
                if (sheetName.length() > 31) sheetName = sheetName.substring(0, 31);
                Sheet sheet = workbook.createSheet(sheetName);
                sheet.setTabColor(toXssfColor(workbook, primary));
                sheet.setDisplayGridlines(false);
                for (int c = 0; c < widths.length; c++) sheet.setColumnWidth(c, widths[c] * 256);

                Row schoolRow = sheet.createRow(0); schoolRow.setHeightInPoints(30);
                Cell school = schoolRow.createCell(0);
                school.setCellValue(safe(data.getSchool().getName()));
                school.setCellStyle(schoolStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 7));

                Row reportTitle = sheet.createRow(1); reportTitle.setHeightInPoints(25);
                Cell title = reportTitle.createCell(0);
                title.setCellValue("TIMETABLE REPORT  |  " + section.getTitle());
                title.setCellStyle(titleStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 9));

                Row metadata = sheet.createRow(2); metadata.setHeightInPoints(23);
                Cell meta = metadata.createCell(0);
                meta.setCellValue("Academic Year: " + safe(data.getAcademicYear()) + "     •     Generated: " + safe(data.getGeneratedAt()));
                meta.setCellStyle(metadataStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 0, 9));

                Row filters = sheet.createRow(3); filters.setHeightInPoints(32);
                Cell filterCell = filters.createCell(0);
                String filterText = timetableFilterSummary(data.getReportTitle());
                filterCell.setCellValue(blank(filterText) ? "Filters: None" : "Filters: " + filterText);
                filterCell.setCellStyle(filterStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(3, 3, 0, 9));

                sheet.createRow(4).setHeightInPoints(8);
                Row header = sheet.createRow(5); header.setHeightInPoints(34);
                for (int c = 0; c < section.getColumns().size(); c++) {
                    Cell cell = header.createCell(c);
                    cell.setCellValue(section.getColumns().get(c));
                    cell.setCellStyle(headerStyle);
                }

                for (int i = 0; i < section.getRows().size(); i++) {
                    List<String> values = section.getRows().get(i);
                    Row row = sheet.createRow(6 + i);
                    row.setHeightInPoints(29);
                    for (int c = 0; c < section.getColumns().size(); c++) {
                        String value = c < values.size() ? values.get(c) : "";
                        Cell cell = row.createCell(c);
                        cell.setCellStyle(i % 2 == 0 ? bodyStyle : alternateStyle);
                        if (c == 5 && isHttpUrl(value)) {
                            cell.setCellValue(meetingDisplayLabel(value));
                            Hyperlink meetingLink = workbook.getCreationHelper().createHyperlink(HyperlinkType.URL);
                            meetingLink.setAddress(value); cell.setHyperlink(meetingLink); cell.setCellStyle(linkStyle);
                        } else {
                            cell.setCellValue((c == 8 || c == 9) ? formatTimetableDate(value) : value);
                            if (c == 6) {
                                if ("APPROVED".equalsIgnoreCase(value)) cell.setCellStyle(statusApproved);
                                else if ("PENDING_APPROVAL".equalsIgnoreCase(value) || "DRAFT".equalsIgnoreCase(value)) cell.setCellStyle(statusPending);
                                else if (!blank(value)) cell.setCellStyle(statusOther);
                            } else if (c == 7) {
                                cell.setCellStyle("Active".equalsIgnoreCase(value) ? activeStyle : inactiveStyle);
                            }
                        }
                    }
                }

                int lastRow = 5 + section.getRows().size();
                if (!section.getRows().isEmpty()) sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(5, lastRow, 0, section.getColumns().size() - 1));
                sheet.createFreezePane(0, 6);
                sheet.setRepeatingRows(new org.apache.poi.ss.util.CellRangeAddress(0, 5, -1, -1));
                workbook.setPrintArea(workbook.getSheetIndex(sheet), 0, section.getColumns().size() - 1, 0, lastRow);
                sheet.getPrintSetup().setLandscape(true);
                sheet.getPrintSetup().setPaperSize(PrintSetup.A4_PAPERSIZE);
                sheet.getPrintSetup().setFitWidth((short) 1);
                sheet.getPrintSetup().setFitHeight((short) 0);
                sheet.setFitToPage(true); sheet.setAutobreaks(true);
                sheet.setHorizontallyCenter(true);
                sheet.setMargin(Sheet.LeftMargin, 0.25); sheet.setMargin(Sheet.RightMargin, 0.25);
                sheet.setMargin(Sheet.TopMargin, 0.35); sheet.setMargin(Sheet.BottomMargin, 0.35);
                sheet.getHeader().setLeft(safe(data.getSchool().getName()));
                sheet.getHeader().setRight(section.getTitle() + " Timetable");
                sheet.getFooter().setLeft("Generated: " + safe(data.getGeneratedAt()));
                sheet.getFooter().setRight("Page &P of &N");
                embedTimetableExcelLogo(workbook, sheet, data.getSchool().getLogoUrl(), 8, 10, 0, 2);
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private String timetableFilterSummary(String reportTitle) {
        String text = safe(reportTitle);
        text = text.replaceFirst("^(My )?Timetable Report", "").trim();
        if (text.startsWith("·")) text = text.substring(1).trim();
        if (text.matches("^\\d{4}-\\d{4}(?:\\s*·.*)?$")) {
            int yearSeparator = text.indexOf("·");
            text = yearSeparator >= 0 ? text.substring(yearSeparator + 1).trim() : "";
        }
        return text.replace("·", " | ");
    }

    private String formatTimetableDate(String value) {
        if (blank(value) || value.equals("null")) return "";
        try { return java.time.LocalDate.parse(value).format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)); }
        catch (Exception ignored) { return value; }
    }

    private boolean isHttpUrl(String value) {
        if (blank(value)) return false;
        try {
            java.net.URI uri = java.net.URI.create(value.trim());
            return ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null;
        } catch (Exception ignored) { return false; }
    }

    private String meetingDisplayLabel(String url) {
        String host = "";
        try { host = java.net.URI.create(url).getHost().toLowerCase(Locale.ROOT).replaceFirst("^www\\.", ""); }
        catch (Exception ignored) {}
        if (host.contains("zoom")) return "Join Zoom meeting";
        if (host.contains("meet.google")) return "Join Google Meet";
        if (host.contains("jit.si")) return "Join Jitsi meeting";
        if (host.contains("teams")) return "Join Teams meeting";
        if (host.contains("webex")) return "Join Webex meeting";
        return "Open online meeting";
    }

    private void drawTimetableMetricCard(PDPageContentStream stream, float x, float y, float width, float height,
                                        String label, String value, String primary, String accent) throws Exception {
        stream.setNonStrokingColor(new Color(244, 247, 251));
        stream.addRect(x, y, width, height); stream.fill();
        stream.setNonStrokingColor(color(accent)); stream.addRect(x, y, 4, height); stream.fill();
        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9, 7,
                x + 14, y + height - 18, label, color(primary), width - 26);
        drawFitText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20, 14,
                x + 14, y + 17, value, Color.BLACK, width - 26);
    }

    private void embedTimetableExcelLogo(Workbook workbook, Sheet sheet, String logoUrl,
                                        int firstColumn, int lastColumn, int firstRow, int lastRow) {
        if (blank(logoUrl) || !logoUrl.startsWith("/public/school-branding/logo/") || !(workbook instanceof XSSFWorkbook)) return;
        try {
            String fileName = logoUrl.substring("/public/school-branding/logo/".length());
            Path path = brandingStorageService.resolve(fileName);
            String extension = path.getFileName().toString().toLowerCase(Locale.ROOT);
            if (extension.endsWith(".webp")) return;
            int pictureType = extension.endsWith(".png") ? Workbook.PICTURE_TYPE_PNG : Workbook.PICTURE_TYPE_JPEG;
            int pictureIndex = workbook.addPicture(Files.readAllBytes(path), pictureType);
            XSSFDrawing drawing = (XSSFDrawing) sheet.createDrawingPatriarch();
            XSSFClientAnchor anchor = new XSSFClientAnchor(0, 0, 0, 0, firstColumn, firstRow, lastColumn, lastRow);
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_DONT_RESIZE);
            drawing.createPicture(anchor, pictureIndex).resize(0.8);
        } catch (Exception ignored) {
            // Missing or unsupported optional branding must not fail report generation.
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
        if (isTimetableReport(data)) return createTimetableExcel(data);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");
            boolean academicPerformanceReport = data.getReportTitle() != null && data.getReportTitle().startsWith("Academic Performance Report");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) (academicPerformanceReport ? 19 : 16));
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);
            ((XSSFCellStyle) titleStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setWrapText(true);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) (academicPerformanceReport ? 12 : 11));
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            ((XSSFCellStyle) headerStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            ((XSSFCellStyle) headerStyle).setBottomBorderColor(toXssfColor(workbook, data.getSchool().getAccentColor()));

            CellStyle sectionStyle = workbook.createCellStyle();
            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) (academicPerformanceReport ? 14 : 12));
            sectionFont.setColor(IndexedColors.WHITE.getIndex());
            sectionStyle.setFont(sectionFont);
            ((XSSFCellStyle) sectionStyle).setFillForegroundColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle metricLabelStyle = workbook.createCellStyle();
            Font metricFont = workbook.createFont();
            metricFont.setBold(true);
            metricFont.setFontHeightInPoints((short) 11);
            metricLabelStyle.setFont(metricFont);
            metricLabelStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            metricLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            metricLabelStyle.setBorderBottom(BorderStyle.THIN);
            metricLabelStyle.setBorderTop(BorderStyle.THIN);
            metricLabelStyle.setBorderLeft(BorderStyle.THIN);
            metricLabelStyle.setBorderRight(BorderStyle.THIN);
            CellStyle metricValueStyle = workbook.createCellStyle();
            Font metricValueFont = workbook.createFont();
            metricValueFont.setBold(academicPerformanceReport);
            metricValueFont.setFontHeightInPoints((short) (academicPerformanceReport ? 14 : 11));
            metricValueStyle.setFont(metricValueFont);
            metricValueStyle.setBorderBottom(BorderStyle.THIN);
            metricValueStyle.setBorderTop(BorderStyle.THIN);
            metricValueStyle.setBorderLeft(BorderStyle.THIN);
            metricValueStyle.setBorderRight(BorderStyle.THIN);
            metricValueStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            int maxColumnCount = data.getColumns().size();
            if (data.getSections() != null) for (ReportData.ReportSection section : data.getSections()) {
                maxColumnCount = Math.max(maxColumnCount, section.getColumns().size());
            }
            int lastColumn = Math.max(1, maxColumnCount - 1);
            boolean classStrengthReport = data.getReportTitle() != null && data.getReportTitle().startsWith("My Class Strength & Student Roster");
            List<String> excelColumns = data.getColumns();
            List<List<String>> excelRows = data.getRows();
            if (classStrengthReport && data.getSections() != null) {
                excelColumns = List.of("Grade", "Section", "Student ID", "Student Name", "Email", "Phone");
                List<List<String>> rosterRows = new ArrayList<>();
                for (ReportData.ReportSection section : data.getSections()) {
                    String sectionTitle = section.getTitle();
                    String gradeLabel = sectionTitle.contains(" · Section ") ? sectionTitle.substring(0, sectionTitle.indexOf(" · Section ")) : "";
                    String sectionLabel = sectionTitle.contains(" · Section ") ? sectionTitle.substring(sectionTitle.indexOf(" · Section ") + 11).replace(" Active Student Roster", "") : "";
                    for (List<String> student : section.getRows()) {
                        rosterRows.add(List.of(gradeLabel, sectionLabel,
                                student.size() > 0 ? student.get(0) : "",
                                student.size() > 1 ? student.get(1) : "",
                                student.size() > 2 ? student.get(2) : "",
                                student.size() > 3 ? student.get(3) : ""));
                    }
                }
                excelRows = rosterRows;
            }
            final List<String> reportColumns = excelColumns;
            final List<List<String>> reportRows = excelRows;
            // Keep the report header and logo aligned with the primary table.
            // Supplemental sections may be wider, but should not push the logo away from the header.
            maxColumnCount = Math.max(reportColumns.size(), 1);
            lastColumn = Math.max(1, maxColumnCount - 1);
            int logoStartColumn = Math.max(0, maxColumnCount - 2);
            int headerTextEndColumn = Math.max(0, logoStartColumn - 1);
            for (int rowIndex = 0; rowIndex <= 4; rowIndex++) {
                Row headerRow = sheet.createRow(rowIndex);
                headerRow.setHeightInPoints(rowIndex == 0 ? 32 : 22);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(
                        rowIndex, rowIndex, 0, headerTextEndColumn));
            }
            if (logoStartColumn < maxColumnCount) {
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(
                        0, 4, logoStartColumn, maxColumnCount - 1));
            }
            Row schoolRow = sheet.getRow(0);
            int headerTextColumn = 0;
            schoolRow.createCell(headerTextColumn).setCellValue(data.getSchool().getName());
            schoolRow.getCell(headerTextColumn).setCellStyle(titleStyle);
            sheet.getRow(1).createCell(headerTextColumn).setCellValue(data.getSchool().getTagline());
            if (academicPerformanceReport) {
                Cell reportTitleCell = sheet.getRow(2).createCell(headerTextColumn);
                reportTitleCell.setCellValue("Academic Performance Report");
                CellStyle reportTitleStyle = workbook.createCellStyle();
                Font reportTitleFont = workbook.createFont();
                reportTitleFont.setBold(true);
                reportTitleFont.setFontHeightInPoints((short) 17);
                ((XSSFFont) reportTitleFont).setColor(toXssfColor(workbook, data.getSchool().getPrimaryColor()));
                reportTitleStyle.setFont(reportTitleFont);
                reportTitleCell.setCellStyle(reportTitleStyle);
                sheet.getRow(2).setHeightInPoints(28);
                Cell taglineCell = sheet.getRow(1).getCell(headerTextColumn);
                CellStyle taglineStyle = workbook.createCellStyle();
                Font taglineFont = workbook.createFont();
                taglineFont.setItalic(true);
                taglineFont.setFontHeightInPoints((short) 11);
                taglineFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
                taglineStyle.setFont(taglineFont);
                if (taglineCell != null) taglineCell.setCellStyle(taglineStyle);
                Cell subtitleCell = sheet.getRow(3).createCell(headerTextColumn);
                subtitleCell.setCellValue(data.getReportTitle().replaceFirst("^Academic Performance Report\\s*[·-]?\\s*", ""));
                CellStyle subtitleStyle = workbook.createCellStyle();
                subtitleStyle.setWrapText(true);
                Font subtitleFont = workbook.createFont();
                subtitleFont.setBold(true);
                subtitleFont.setFontHeightInPoints((short) 11);
                subtitleStyle.setFont(subtitleFont);
                subtitleCell.setCellStyle(subtitleStyle);
                sheet.getRow(3).setHeightInPoints(32);
                String contactDetails = String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                        data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList());
                Cell metadataCell = sheet.getRow(4).createCell(headerTextColumn);
                metadataCell.setCellValue((data.getAcademicYear() == null ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                        + "Generated: " + data.getGeneratedAt() + " · Records: " + reportRows.size()
                        + (contactDetails.isEmpty() ? "" : " · " + contactDetails));
                CellStyle metadataStyle = workbook.createCellStyle();
                metadataStyle.setWrapText(true);
                Font metadataFont = workbook.createFont();
                metadataFont.setFontHeightInPoints((short) 10);
                metadataFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
                metadataStyle.setFont(metadataFont);
                metadataCell.setCellStyle(metadataStyle);
                sheet.getRow(4).setHeightInPoints(42);
            } else {
                sheet.getRow(2).createCell(headerTextColumn).setCellValue(data.getReportTitle());
                sheet.getRow(3).createCell(headerTextColumn).setCellValue((data.getAcademicYear() == null ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                        + "Generated: " + data.getGeneratedAt() + " · Records: " + reportRows.size()
                        + (blank(data.getPreparedBy()) ? "" : " · Report prepared by: " + data.getPreparedBy() + " (Faculty)"));
                sheet.getRow(4).createCell(headerTextColumn).setCellValue(String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                        data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList()));
            }

            int rowCursor = 6;
            if (data.getSummary() != null && !data.getSummary().isEmpty()) {
                for (int i = 0; i < data.getSummary().size(); i += 3) {
                    Row summaryRow = sheet.createRow(rowCursor++);
                    if (academicPerformanceReport) summaryRow.setHeightInPoints(28);
                    for (int metricIndex = i; metricIndex < Math.min(i + 3, data.getSummary().size()); metricIndex++) {
                        int cellIndex = (metricIndex - i) * 2;
                        var metric = data.getSummary().get(metricIndex);
                        Cell label = summaryRow.createCell(cellIndex);
                        label.setCellValue(metric.getLabel());
                        label.setCellStyle(metricLabelStyle);
                        Cell value = summaryRow.createCell(cellIndex + 1);
                        value.setCellValue(metric.getValue());
                        value.setCellStyle(metricValueStyle);
                    }
                }
                rowCursor++;
            }
            int mainHeaderRow = rowCursor;
            Row headerRow = sheet.createRow(mainHeaderRow);
            headerRow.setHeightInPoints(academicPerformanceReport ? 34 : 30);
            for (int column = 0; column < reportColumns.size(); column++) {
                Cell cell = headerRow.createCell(column);
                cell.setCellValue(reportColumns.get(column));
                cell.setCellStyle(headerStyle);
            }
            CellStyle wrappedCellStyle = workbook.createCellStyle();
            wrappedCellStyle.setWrapText(true);
            wrappedCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Font academicBodyFont = null;
            if (academicPerformanceReport) {
                academicBodyFont = workbook.createFont();
                academicBodyFont.setFontHeightInPoints((short) 11);
                wrappedCellStyle.setFont(academicBodyFont);
            }
            wrappedCellStyle.setBorderBottom(BorderStyle.THIN);
            wrappedCellStyle.setBorderTop(BorderStyle.THIN);
            wrappedCellStyle.setBorderLeft(BorderStyle.THIN);
            wrappedCellStyle.setBorderRight(BorderStyle.THIN);
            CellStyle alternateRowStyle = workbook.createCellStyle();
            alternateRowStyle.setWrapText(true);
            alternateRowStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            if (academicPerformanceReport) alternateRowStyle.setFont(academicBodyFont);
            alternateRowStyle.setBorderBottom(BorderStyle.THIN);
            alternateRowStyle.setBorderTop(BorderStyle.THIN);
            alternateRowStyle.setBorderLeft(BorderStyle.THIN);
            alternateRowStyle.setBorderRight(BorderStyle.THIN);
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
            for (int rowIndex = 0; rowIndex < reportRows.size(); rowIndex++) {
                Row row = sheet.createRow(mainDataStart + rowIndex);
                row.setHeightInPoints(classStrengthReport ? 25 : academicPerformanceReport ? 30 : 28);
                List<String> values = reportRows.get(rowIndex);
                for (int column = 0; column < reportColumns.size(); column++) {
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
            for (int column = 0; column < reportColumns.size(); column++) {
                String heading = reportColumns.get(column).toLowerCase(Locale.ROOT);
                int width = academicPerformanceReport && heading.equals("student name") ? 28
                        : academicPerformanceReport && heading.equals("username") ? 28
                        : academicPerformanceReport && heading.contains("status") ? 22
                        : academicPerformanceReport && (heading.contains("marks") || heading.contains("maximum") || heading.contains("percentage")) ? 17
                        : heading.contains("email") ? 36 : heading.equals("student") || heading.equals("student name") || heading.contains("faculty name") || heading.equals("faculty") ? 32
                        : data.getColumns().contains("Attendance Flag") && column == 6 ? 32
                        : heading.contains("subject") ? 28 : heading.contains("phone") ? 18
                        : heading.contains("attendance flag") ? 22 : heading.contains("grade") ? 14 : heading.contains("section") ? 12
                        : heading.contains("time") ? 12 : heading.contains("attendance rate") ? 20 : 15;
                sheet.setColumnWidth(column, width * 256);
            }
            if (classStrengthReport) {
                sheet.setColumnWidth(0, 14 * 256);
                sheet.setColumnWidth(1, 12 * 256);
                sheet.setColumnWidth(2, 24 * 256);
                sheet.setColumnWidth(3, 28 * 256);
                sheet.setColumnWidth(4, 36 * 256);
                sheet.setColumnWidth(5, 18 * 256);
            }
            int mainDataEnd = mainDataStart + reportRows.size() - 1;
            if (!reportRows.isEmpty()) sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(mainHeaderRow, mainDataEnd, 0, reportColumns.size() - 1));
            int sectionCursor = mainDataStart + reportRows.size() + 2;
            if (!classStrengthReport && data.getSections() != null) {
                for (ReportData.ReportSection section : data.getSections()) {
                    Row sectionTitleRow = sheet.createRow(sectionCursor++);
                    sectionTitleRow.createCell(0).setCellValue(section.getTitle());
                    sectionTitleRow.getCell(0).setCellStyle(sectionStyle);
                    sectionTitleRow.setHeightInPoints(academicPerformanceReport ? 28 : 24);
                    sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(sectionTitleRow.getRowNum(), sectionTitleRow.getRowNum(), 0, Math.max(0, maxColumnCount - 1)));
                    Row sectionHeader = sheet.createRow(sectionCursor++);
                    sectionHeader.setHeightInPoints(academicPerformanceReport ? 34 : 30);
                    for (int column = 0; column < section.getColumns().size(); column++) {
                        Cell cell = sectionHeader.createCell(column);
                        cell.setCellValue(section.getColumns().get(column));
                        cell.setCellStyle(headerStyle);
                    }
                    for (int rowIndex = 0; rowIndex < section.getRows().size(); rowIndex++) {
                        Row row = sheet.createRow(sectionCursor++);
                        row.setHeightInPoints(classStrengthReport ? 24 : academicPerformanceReport ? 30 : 32);
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
            embedExcelLogo(workbook, sheet, data.getSchool().getLogoUrl(), logoStartColumn, maxColumnCount);
            sheet.createFreezePane(0, mainHeaderRow + 1);
            sheet.getPrintSetup().setLandscape(true);
            sheet.getPrintSetup().setFitWidth((short) 1);
            sheet.getPrintSetup().setFitHeight((short) 0);
            sheet.setFitToPage(true);
            sheet.setAutobreaks(true);
            // Keep one worksheet for both tables; repeating the student header above the audit would be misleading.
            int printColumnCount = reportColumns.size();
            if (!classStrengthReport && data.getSections() != null) for (ReportData.ReportSection section : data.getSections()) printColumnCount = Math.max(printColumnCount, section.getColumns().size());
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
        if (columns.size() == 4 && columns.contains("Student ID") && columns.contains("Student Name")) return new float[]{0.18f, 0.30f, 0.34f, 0.18f};
        if (columns.size() == 6 && columns.get(0).equalsIgnoreCase("Student")) return new float[]{0.27f, 0.24f, 0.13f, 0.12f, 0.10f, 0.14f};
        if (columns.size() == 6 && columns.contains("Username") && columns.contains("Submission Status")) return new float[]{0.22f, 0.22f, 0.18f, 0.12f, 0.12f, 0.14f};
        if (columns.size() == 6 && columns.contains("Student ID") && columns.contains("Grade")) return new float[]{0.11f, 0.08f, 0.18f, 0.23f, 0.30f, 0.10f};
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
        return normalized.equals("student") || normalized.equals("student name") || normalized.equals("faculty") || normalized.equals("faculty name");
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

    private void embedExcelLogo(Workbook workbook, Sheet sheet, String logoUrl, int firstLogoColumn, int lastLogoColumn) {
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

            // The logo is positioned in the rightmost reserved header columns for every report.
            float availableWidth = 0f;
            for (int column = firstLogoColumn; column < lastLogoColumn; column++) availableWidth += sheet.getColumnWidthInPixels(column);
            availableWidth -= 12f;
            float availableHeight = 0f;
            for (int rowIndex = 0; rowIndex <= 4; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                availableHeight += (row == null ? sheet.getDefaultRowHeightInPoints() : row.getHeightInPoints()) * 96f / 72f;
            }
            availableHeight -= 12f;
            float scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
            // Keep logos visually compact even when the reserved columns are unusually wide.
            scale = Math.min(scale, 72f / Math.max(imageWidth, imageHeight));
            float displayWidth = imageWidth * scale;
            float displayHeight = imageHeight * scale;
            float leftInset = (availableWidth + 12f - displayWidth) / 2f;
            float topInset = (availableHeight + 12f - displayHeight) / 2f;

            int pictureIndex = workbook.addPicture(Files.readAllBytes(path), pictureType);
            XSSFDrawing drawing = (XSSFDrawing) sheet.createDrawingPatriarch();
            XSSFClientAnchor anchor = new XSSFClientAnchor(
                    Units.pixelToEMU(Math.round(leftInset)), Units.pixelToEMU(Math.round(topInset)),
                    Units.pixelToEMU(Math.round(leftInset + displayWidth - (availableWidth + 12f))),
                    Units.pixelToEMU(Math.round(topInset + displayHeight - (availableHeight + 12f))),
                    firstLogoColumn, 0, lastLogoColumn, 5);
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
