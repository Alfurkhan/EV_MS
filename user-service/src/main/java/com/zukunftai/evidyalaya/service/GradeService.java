package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Grade;

import java.util.List;

public interface GradeService {

    Grade createGrade(
            Long academicYearId,
            String name,
            String description
    );

    List<Grade> getAllGrades();

    List<Grade> getGradesByAcademicYear(
            Long academicYearId
    );

    Grade getGradeById(Long id);

    Grade updateGrade(
            Long id,
            String name,
            String description,
            boolean active
    );

    void deleteGrade(Long id);
}