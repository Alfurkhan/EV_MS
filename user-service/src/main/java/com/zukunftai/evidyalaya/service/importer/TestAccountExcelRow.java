package com.zukunftai.evidyalaya.service.importer;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TestAccountExcelRow {

    private final String sheetName;

    private final String serialNumber;
    private final String name;
    private final String email;
    private final String mobile;
    private final String password;

    private final String academicYear;
    private final String grade;
    private final String section;
    private final String subjects;
}