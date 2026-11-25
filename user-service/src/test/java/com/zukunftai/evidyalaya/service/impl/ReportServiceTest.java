package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
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
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private StudentEnrollmentRepository enrollmentRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private TimetableRepository timetableRepository;
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
        when(userRepository.findAll()).thenReturn(List.of());
        when(subjectRepository.findAllWithFaculties()).thenReturn(List.of());
        when(schoolSettingsService.getSettings()).thenReturn(Map.of(
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
    void rejectsUnsupportedExportFormat() {
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> reportService.exportFacultyDirectory("docx"));
    }
}
