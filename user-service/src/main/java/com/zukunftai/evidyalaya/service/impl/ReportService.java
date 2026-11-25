package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.ReportData;
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
        if (sectionId != null) {
            Section section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found."));
            if (!section.getGrade().getAcademicYear().getId().equals(year.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected section does not belong to the selected academic year.");
            }
            if (gradeId != null && !section.getGrade().getId().equals(gradeId)) {
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
        String filterDescription = sectionId != null ? "Section-filtered" : gradeId != null ? "Grade-filtered" : "All classes";
        return buildReport(title, year.getName(), List.of("Student", "Email", "Phone", "Grade", "Section", "Enrollment"), rows,
                isFaculty ? "Faculty access · " + filterDescription : filterDescription);
    }

    public ReportData getFacultyDirectory() {
        User actor = userService.getPrincipal();
        if (!hasRole(actor, RoleName.ROLE_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can generate the faculty directory.");
        }

        List<User> faculty = userRepository.findAll().stream()
                .filter(user -> hasRole(user, RoleName.ROLE_FACULTY) && !user.isAccountDeleted())
                .sorted(Comparator.comparing(user -> Optional.ofNullable(user.getFullName()).orElse("").toLowerCase()))
                .toList();

        Map<Long, String> subjectNames = new HashMap<>();
        subjectRepository.findAllWithFaculties().forEach(subject ->
                subject.getFaculties().forEach(user ->
                        subjectNames.merge(user.getId(), subject.getName(), (oldValue, newValue) -> oldValue + ", " + newValue)));

        List<List<String>> rows = faculty.stream()
                .map(user -> List.of(
                        safe(user.getFullName()),
                        safe(user.getEmail()),
                        safe(user.getPhoneNumber()),
                        safe(subjectNames.get(user.getId())),
                        user.isAccountEnabled() ? "Enabled" : "Disabled",
                        user.isAccountLocked() ? "Locked" : "Unlocked"
                ))
                .toList();

        return buildReport("Faculty Directory", null,
                List.of("Faculty Name", "Email", "Phone", "Assigned Subjects", "Account", "Security"), rows, "All faculty accounts");
    }

    public byte[] exportStudentRoster(Long academicYearId, Long gradeId, Long sectionId, String format) {
        return export(getStudentRoster(academicYearId, gradeId, sectionId), format);
    }

    public byte[] exportFacultyDirectory(String format) {
        return export(getFacultyDirectory(), format);
    }

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
                    float columnWidth = usableWidth / Math.max(1, data.getColumns().size());
                    stream.setNonStrokingColor(color(data.getSchool().getPrimaryColor()));
                    stream.addRect(margin, y - headerHeight + 4, usableWidth, headerHeight);
                    stream.fill();
                    for (int col = 0; col < data.getColumns().size(); col++) {
                        drawText(stream, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 8,
                                margin + col * columnWidth + 4, y - 11, truncate(data.getColumns().get(col), 20), Color.WHITE);
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
                                    margin + col * columnWidth + 4, y - 10, truncate(value, 27), Color.BLACK);
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
                            "Page " + pageNumber, Color.DARK_GRAY);
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

            Row schoolRow = sheet.createRow(0);
            schoolRow.createCell(0).setCellValue(data.getSchool().getName());
            schoolRow.getCell(0).setCellStyle(titleStyle);
            Row taglineRow = sheet.createRow(1);
            taglineRow.createCell(0).setCellValue(data.getSchool().getTagline());
            Row titleRow = sheet.createRow(2);
            titleRow.createCell(0).setCellValue(data.getReportTitle());
            Row metadataRow = sheet.createRow(3);
            metadataRow.createCell(0).setCellValue((data.getAcademicYear() == null ? "" : "Academic Year: " + data.getAcademicYear() + " · ")
                    + "Generated: " + data.getGeneratedAt() + " · Records: " + data.getRows().size());
            Row contactRow = sheet.createRow(4);
            contactRow.createCell(0).setCellValue(String.join(" · ", Arrays.asList(data.getSchool().getAddress(), data.getSchool().getPhone(),
                    data.getSchool().getEmail(), data.getSchool().getWebsite()).stream().filter(value -> !blank(value)).toList()));

            embedExcelLogo(workbook, sheet, data.getSchool().getLogoUrl());
            Row headerRow = sheet.createRow(6);
            for (int column = 0; column < data.getColumns().size(); column++) {
                Cell cell = headerRow.createCell(column);
                cell.setCellValue(data.getColumns().get(column));
                cell.setCellStyle(headerStyle);
            }
            for (int rowIndex = 0; rowIndex < data.getRows().size(); rowIndex++) {
                Row row = sheet.createRow(7 + rowIndex);
                List<String> values = data.getRows().get(rowIndex);
                for (int column = 0; column < data.getColumns().size(); column++) {
                    row.createCell(column).setCellValue(column < values.size() ? values.get(column) : "");
                }
            }
            for (int column = 0; column < data.getColumns().size(); column++) {
                sheet.autoSizeColumn(column);
                sheet.setColumnWidth(column, Math.min(sheet.getColumnWidth(column), 11000));
            }
            sheet.createFreezePane(0, 7);
            workbook.write(output);
            return output.toByteArray();
        }
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
            int pictureType = extension.endsWith(".png") ? Workbook.PICTURE_TYPE_PNG : Workbook.PICTURE_TYPE_JPEG;
            if (extension.endsWith(".webp")) return;
            int pictureIndex = workbook.addPicture(Files.readAllBytes(path), pictureType);
            XSSFDrawing drawing = xssf.getSheetAt(0).createDrawingPatriarch();
            XSSFClientAnchor anchor = new XSSFClientAnchor(0, 0, 0, 0, 5, 0, 7, 4);
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
