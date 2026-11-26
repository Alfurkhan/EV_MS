package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.repository.AttendanceRepository;
import com.zukunftai.evidyalaya.repository.ClassSessionRepository;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import com.zukunftai.evidyalaya.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private StudentEnrollmentRepository enrollmentRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private TimetableRepository timetableRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private ClassSessionRepository classSessionRepository;
    @Mock private SchoolSettingsService schoolSettingsService;
    @Mock private UserService userService;
    @Mock private SchoolBrandingStorageService brandingStorageService;

    @InjectMocks private ReportService reportService;

    @BeforeEach
    void setUp() {
        User admin = User.builder()
                .id(1L)
                .fullName("Report Test Admin")
                .roles(Set.of(new Role(1L, RoleName.ROLE_ADMIN)))
                .build();
        when(userService.getPrincipal()).thenReturn(admin);
        lenient().when(userRepository.findAll()).thenReturn(List.of());
        lenient().when(subjectRepository.findAllWithFaculties()).thenReturn(List.of());
        lenient().when(schoolSettingsService.getSettings()).thenReturn(Map.of(
                "school.name", "Example School",
                "school.tagline", "Learning together",
                "school.address", "123 School Road",
                "school.phone", "1234567890",
                "school.email", "office@example.test",
                "school.website", "https://example.test",
                "theme.primaryColor", "#0D9488",
                "theme.accentColor", "#D97706"
        ));
    }

    @Test
    void facultyDirectoryPreviewUsesSchoolIdentityAndTheme() {
        var report = reportService.getFacultyDirectory();

        assertEquals("Faculty Directory · All subjects · All account statuses", report.getReportTitle());
        assertEquals("Example School", report.getSchool().getName());
        assertEquals("#0D9488", report.getSchool().getPrimaryColor());
        assertEquals("#D97706", report.getSchool().getAccentColor());
        assertEquals(List.of("Faculty Name", "Email", "Phone", "Assigned Subjects", "Account", "Security"), report.getColumns());
        assertTrue(report.getRows().isEmpty());
    }

    @Test
    void exportsFacultyDirectoryAsPdf() {
        byte[] pdf = reportService.exportFacultyDirectory("pdf");

        assertNotNull(pdf);
        assertTrue(pdf.length > 4);
        assertEquals("%PDF", new String(pdf, 0, 4));
    }

    @Test
    void exportsFacultyDirectoryAsExcelWorkbook() {
        byte[] excel = reportService.exportFacultyDirectory("xlsx");

        assertNotNull(excel);
        assertTrue(excel.length > 4);
        assertEquals("PK", new String(excel, 0, 2));
    }


    @Test
    void attendanceReportPreviewIncludesSummaryAndSessionAuditSection() {
        AcademicYear year = AcademicYear.builder()
                .id(7L)
                .name("2026-2027")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2027, 3, 31))
                .active(true)
                .build();
        when(academicYearRepository.findById(7L)).thenReturn(Optional.of(year));
        when(enrollmentRepository.findByAcademicYear(year)).thenReturn(List.of());
        when(classSessionRepository.findBySessionDateBetweenAndStatus(
                LocalDate.of(2026, 6, 1), LocalDate.of(2027, 3, 31),
                com.zukunftai.evidyalaya.model.ClassSessionStatus.COMPLETED)).thenReturn(List.of());

        var report = reportService.getAttendanceReport(7L, null, null, null, null, "ALL");

        assertEquals("Attendance Report · Date: 2026-06-01 to 2027-03-31 · All grades and sections", report.getReportTitle());
        assertEquals("2026-2027", report.getAcademicYear());
        assertEquals(12, report.getColumns().size());
        assertTrue(report.getRows().isEmpty());
        assertEquals(13, report.getSummary().size());
        assertEquals("Overall Attendance Rate", report.getSummary().get(9).getLabel());
        assertEquals("Attendance Marking Completion", report.getSummary().get(10).getLabel());
        assertEquals("Completed Sessions", report.getSummary().get(0).getLabel());
        assertEquals("0", report.getSummary().get(0).getValue());
        assertEquals("Session-wise Attendance Audit", report.getSections().get(0).getTitle());
        assertEquals(14, report.getSections().get(0).getColumns().size());
        assertTrue(report.getSections().get(0).getRows().isEmpty());
    }


    @Test
    void attendanceReportCalculatesStudentAndSessionTotals() {
        AcademicYear year = AcademicYear.builder()
                .id(7L).name("2026-2027")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2027, 3, 31)).active(true).build();
        when(academicYearRepository.findById(7L)).thenReturn(Optional.of(year));

        var grade = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Grade.class);
        var section = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Section.class);
        var subject = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Subject.class);
        var faculty = org.mockito.Mockito.mock(User.class);
        var studentPresent = org.mockito.Mockito.mock(User.class);
        var studentAbsent = org.mockito.Mockito.mock(User.class);
        var enrollmentPresent = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.StudentEnrollment.class);
        var enrollmentAbsent = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.StudentEnrollment.class);
        var timetable = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Timetable.class);
        var session = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.ClassSession.class);
        var presentRecord = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Attendance.class);
        var absentRecord = org.mockito.Mockito.mock(com.zukunftai.evidyalaya.database.Attendance.class);

        when(grade.getId()).thenReturn(3L);
        when(grade.getName()).thenReturn("Grade 10");
        when(section.getId()).thenReturn(4L);
        when(section.getName()).thenReturn("A");
        when(studentPresent.getId()).thenReturn(10L);
        when(studentPresent.getFullName()).thenReturn("A Student");
        when(studentPresent.getEmail()).thenReturn("a@example.test");
        when(studentAbsent.getId()).thenReturn(11L);
        when(studentAbsent.getFullName()).thenReturn("B Student");
        when(studentAbsent.getEmail()).thenReturn("b@example.test");
        when(enrollmentPresent.getGrade()).thenReturn(grade);
        when(enrollmentPresent.getSection()).thenReturn(section);
        when(enrollmentPresent.getStudent()).thenReturn(studentPresent);
        when(enrollmentAbsent.getGrade()).thenReturn(grade);
        when(enrollmentAbsent.getSection()).thenReturn(section);
        when(enrollmentAbsent.getStudent()).thenReturn(studentAbsent);
        when(enrollmentRepository.findByAcademicYear(year)).thenReturn(List.of(enrollmentPresent, enrollmentAbsent));

        when(timetable.getAcademicYear()).thenReturn(year);
        when(timetable.getGrade()).thenReturn(grade);
        when(timetable.getSection()).thenReturn(section);
        when(timetable.getSubject()).thenReturn(subject);
        when(timetable.getFaculty()).thenReturn(faculty);
        when(timetable.getStatus()).thenReturn(com.zukunftai.evidyalaya.database.TimetableStatus.APPROVED);
        when(subject.getName()).thenReturn("Mathematics");
        when(faculty.getFullName()).thenReturn("Teacher");
        when(session.getId()).thenReturn(50L);
        when(session.getTimetable()).thenReturn(timetable);
        when(session.getSessionDate()).thenReturn(LocalDate.of(2026, 6, 2));
        when(classSessionRepository.findBySessionDateBetweenAndStatus(
                LocalDate.of(2026, 6, 1), LocalDate.of(2027, 3, 31),
                com.zukunftai.evidyalaya.model.ClassSessionStatus.COMPLETED)).thenReturn(List.of(session));

        when(presentRecord.getClassSession()).thenReturn(session);
        when(presentRecord.getStudent()).thenReturn(studentPresent);
        when(presentRecord.getStatus()).thenReturn(com.zukunftai.evidyalaya.model.AttendanceStatus.PRESENT);
        when(absentRecord.getClassSession()).thenReturn(session);
        when(absentRecord.getStudent()).thenReturn(studentAbsent);
        when(absentRecord.getStatus()).thenReturn(com.zukunftai.evidyalaya.model.AttendanceStatus.ABSENT);
        when(attendanceRepository.findByClassSessionIn(List.of(session))).thenReturn(List.of(presentRecord, absentRecord));

        var report = reportService.getAttendanceReport(7L, null, null, null, null, "ALL");

        assertEquals(2, report.getRows().size());
        assertEquals("1", report.getRows().get(0).get(4));
        assertEquals("1", report.getRows().get(0).get(5));
        assertEquals("100.00%", report.getRows().get(0).get(10));
        assertEquals("1", report.getRows().get(1).get(7));
        assertEquals("0.00%", report.getRows().get(1).get(10));
        assertEquals("Low Attendance", report.getRows().get(1).get(11));
        assertEquals("50.00%", report.getSummary().get(9).getValue());
        assertEquals("100.00%", report.getSummary().get(10).getValue());
        assertEquals("2026-06-02", report.getSections().get(0).getRows().get(0).get(0));
        assertEquals("Complete", report.getSections().get(0).getRows().get(0).get(13));
        assertEquals("Complete", report.getSections().get(0).getRows().get(0).get(13));

        var filtered = reportService.getAttendanceReport(7L, null, null, null, null, "PRESENT");
        assertEquals(1, filtered.getRows().size());
        assertEquals("A Student", filtered.getRows().get(0).get(0));
        assertEquals(1, filtered.getSections().get(0).getRows().size());

        byte[] pdf = reportService.exportAttendanceReport(7L, null, null, null, null, "ALL", "pdf");
        byte[] xlsx = reportService.exportAttendanceReport(7L, null, null, null, null, "ALL", "xlsx");
        assertEquals("%PDF", new String(pdf, 0, 4));
        assertEquals("PK", new String(xlsx, 0, 2));
    }

    @Test
    void attendanceReportRejectsReversedDateRange() {
        AcademicYear year = AcademicYear.builder()
                .id(7L)
                .name("2026-2027")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2027, 3, 31))
                .active(true)
                .build();
        when(academicYearRepository.findById(7L)).thenReturn(Optional.of(year));

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> reportService.getAttendanceReport(7L, null, null,
                        LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 1), "ALL"));
    }

    @Test
    void attendanceReportRejectsUnknownStatusFilter() {
        AcademicYear year = AcademicYear.builder()
                .id(7L)
                .name("2026-2027")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2027, 3, 31))
                .active(true)
                .build();
        when(academicYearRepository.findById(7L)).thenReturn(Optional.of(year));

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> reportService.getAttendanceReport(7L, null, null, null, null, "SUSPENDED"));
    }

    @Test
    void rejectsUnsupportedExportFormat() {
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> reportService.exportFacultyDirectory("docx"));
    }
}
