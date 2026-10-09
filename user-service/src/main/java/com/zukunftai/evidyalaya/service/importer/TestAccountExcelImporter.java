package com.zukunftai.evidyalaya.service.importer;

import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Component
public class TestAccountExcelImporter {

    private static final String STUDENTS_SHEET = "Students";
    private static final String FACULTIES_SHEET = "Faculties";

    private static final List<String> STUDENT_HEADERS = List.of(
            "S.No.",
            "Name",
            "Email Id",
            "Mobile",
            "Password",
            "Academic Year",
            "Grade",
            "Section"
    );

    private static final List<String> FACULTY_HEADERS = List.of(
            "S.No.",
            "Name",
            "Email Id",
            "Mobile",
            "Password",
            "Academic Year",
            "Grade",
            "Section",
            "Subjects"
    );

    public List<TestAccountExcelRow> read(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new TestAccountImportException(
                    "Excel file is empty or missing."
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null ||
                !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {

            throw new TestAccountImportException(
                    "Only .xlsx Excel files are supported."
            );
        }

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            validateRequiredSheets(workbook);

            List<TestAccountExcelRow> rows = new ArrayList<>();

            rows.addAll(
                    readSheet(
                            workbook.getSheet(STUDENTS_SHEET),
                            STUDENTS_SHEET,
                            STUDENT_HEADERS,
                            false
                    )
            );

            rows.addAll(
                    readSheet(
                            workbook.getSheet(FACULTIES_SHEET),
                            FACULTIES_SHEET,
                            FACULTY_HEADERS,
                            true
                    )
            );

            validateDuplicateEmails(rows);
            validateDuplicateSerialNumbers(rows);

            return rows;

        } catch (TestAccountImportException exception) {
            throw exception;

        } catch (IOException exception) {
            throw new TestAccountImportException(
                    "Unable to read the Excel file.",
                    exception
            );

        } catch (Exception exception) {
            throw new TestAccountImportException(
                    "Invalid or unreadable Excel file.",
                    exception
            );
        }
    }

    private void validateRequiredSheets(Workbook workbook) {

        if (workbook.getSheet(STUDENTS_SHEET) == null) {
            throw new TestAccountImportException(
                    "Required sheet 'Students' was not found."
            );
        }

        if (workbook.getSheet(FACULTIES_SHEET) == null) {
            throw new TestAccountImportException(
                    "Required sheet 'Faculties' was not found."
            );
        }
    }

    private List<TestAccountExcelRow> readSheet(
            Sheet sheet,
            String sheetName,
            List<String> requiredHeaders,
            boolean facultySheet
    ) {

        Row headerRow = sheet.getRow(0);

        if (headerRow == null) {
            throw new TestAccountImportException(
                    "Sheet '" + sheetName + "' is empty."
            );
        }

        Map<String, Integer> headerIndexes =
                readHeaderIndexes(headerRow);

        validateHeaders(
                sheetName,
                headerIndexes,
                requiredHeaders
        );

        List<TestAccountExcelRow> rows = new ArrayList<>();

        for (int rowIndex = 1;
             rowIndex <= sheet.getLastRowNum();
             rowIndex++) {

            Row row = sheet.getRow(rowIndex);

            if (isEmptyRow(row)) {
                continue;
            }

            int excelRowNumber = rowIndex + 1;

            String serialNumber =
                    getCellValue(
                            row,
                            headerIndexes.get("S.No.")
                    );

            String name =
                    getCellValue(
                            row,
                            headerIndexes.get("Name")
                    );

            String email =
                    getCellValue(
                            row,
                            headerIndexes.get("Email Id")
                    );

            String mobile =
                    getCellValue(
                            row,
                            headerIndexes.get("Mobile")
                    );

            String password =
                    getCellValue(
                            row,
                            headerIndexes.get("Password")
                    );

            String academicYear =
                    getCellValue(
                            row,
                            headerIndexes.get("Academic Year")
                    );

            String grade =
                    getCellValue(
                            row,
                            headerIndexes.get("Grade")
                    );

            String section =
                    getCellValue(
                            row,
                            headerIndexes.get("Section")
                    );

            String subjects = null;

            if (facultySheet) {
                subjects =
                        getCellValue(
                                row,
                                headerIndexes.get("Subjects")
                        );
            }

            validateRequiredRowValues(
                    sheetName,
                    excelRowNumber,
                    serialNumber,
                    name,
                    email,
                    mobile,
                    password,
                    academicYear,
                    grade,
                    section
            );

            if (facultySheet &&
                    (subjects == null || subjects.isBlank())) {

                throw new TestAccountImportException(
                        sheetName + " row " + excelRowNumber +
                                ": Subjects cannot be empty."
                );
            }

            rows.add(
                    new TestAccountExcelRow(
                            sheetName,
                            serialNumber,
                            name,
                            email,
                            mobile,
                            password,
                            academicYear,
                            grade,
                            section,
                            subjects
                    )
            );
        }

        if (rows.isEmpty()) {
            throw new TestAccountImportException(
                    "Sheet '" + sheetName +
                            "' does not contain any account rows."
            );
        }

        return rows;
    }

    private Map<String, Integer> readHeaderIndexes(
            Row headerRow
    ) {

        Map<String, Integer> indexes = new HashMap<>();

        for (Cell cell : headerRow) {

            String header =
                    getCellValue(cell);

            if (header != null && !header.isBlank()) {
                indexes.put(header.trim(), cell.getColumnIndex());
            }
        }

        return indexes;
    }

    private void validateHeaders(
            String sheetName,
            Map<String, Integer> headerIndexes,
            List<String> requiredHeaders
    ) {

        for (String requiredHeader : requiredHeaders) {

            if (!headerIndexes.containsKey(requiredHeader)) {

                throw new TestAccountImportException(
                        "Sheet '" + sheetName +
                                "' is missing required column '" +
                                requiredHeader + "'."
                );
            }
        }
    }

    private void validateRequiredRowValues(
            String sheetName,
            int rowNumber,
            String serialNumber,
            String name,
            String email,
            String mobile,
            String password,
            String academicYear,
            String grade,
            String section
    ) {

        validateRequired(
                sheetName,
                rowNumber,
                "S.No.",
                serialNumber
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Name",
                name
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Email Id",
                email
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Mobile",
                mobile
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Password",
                password
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Academic Year",
                academicYear
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Grade",
                grade
        );

        validateRequired(
                sheetName,
                rowNumber,
                "Section",
                section
        );
    }

    private void validateRequired(
            String sheetName,
            int rowNumber,
            String field,
            String value
    ) {

        if (value == null || value.isBlank()) {

            throw new TestAccountImportException(
                    sheetName + " row " + rowNumber +
                            ": " + field + " cannot be empty."
            );
        }
    }

    private void validateDuplicateEmails(
            List<TestAccountExcelRow> rows
    ) {

        Set<String> emails = new HashSet<>();

        for (TestAccountExcelRow row : rows) {

            String normalizedEmail =
                    row.getEmail()
                            .trim()
                            .toLowerCase(Locale.ROOT);

            if (!emails.add(normalizedEmail)) {

                throw new TestAccountImportException(
                        "Duplicate email found in Excel: " +
                                row.getEmail()
                );
            }
        }
    }

    private void validateDuplicateSerialNumbers(
            List<TestAccountExcelRow> rows
    ) {

        Map<String, String> serialNumbers = new HashMap<>();

        for (TestAccountExcelRow row : rows) {

            String normalizedSerial =
                    row.getSerialNumber()
                            .trim()
                            .toLowerCase(Locale.ROOT);

            String previousSheet =
                    serialNumbers.putIfAbsent(
                            normalizedSerial,
                            row.getSheetName()
                    );

            if (previousSheet != null) {

                throw new TestAccountImportException(
                        "Duplicate S.No. found in Excel: " +
                                row.getSerialNumber() +
                                " (" +
                                previousSheet +
                                " and " +
                                row.getSheetName() +
                                ")."
                );
            }
        }
    }

    private boolean isEmptyRow(Row row) {

        if (row == null) {
            return true;
        }

        for (Cell cell : row) {

            if (cell != null &&
                    !getCellValue(cell).isBlank()) {

                return false;
            }
        }

        return true;
    }

    private String getCellValue(
            Row row,
            Integer columnIndex
    ) {

        if (columnIndex == null) {
            return "";
        }

        Cell cell = row.getCell(
                columnIndex,
                Row.MissingCellPolicy.RETURN_BLANK_AS_NULL
        );

        return getCellValue(cell);
    }

    private String getCellValue(Cell cell) {

        if (cell == null) {
            return "";
        }

        DataFormatter formatter =
                new DataFormatter();

        return formatter
                .formatCellValue(cell)
                .trim();
    }
}