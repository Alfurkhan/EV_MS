package com.zukunftai.evidyalaya.service.importer;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class TestAccountImportResult {

    private int studentsCreated;
    private int facultiesCreated;

    private final List<String> errors = new ArrayList<>();

    public void incrementStudentsCreated() {
        studentsCreated++;
    }

    public void incrementFacultiesCreated() {
        facultiesCreated++;
    }

    public void addError(String error) {
        errors.add(error);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public int getTotalCreated() {
        return studentsCreated + facultiesCreated;
    }
}