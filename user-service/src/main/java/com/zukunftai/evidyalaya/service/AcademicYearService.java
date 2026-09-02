package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.AcademicYear;

import java.time.LocalDate;
import java.util.List;

public interface AcademicYearService {

    AcademicYear createAcademicYear(
            String name,
            LocalDate startDate,
            LocalDate endDate
    );

    List<AcademicYear> getAllAcademicYears();

    AcademicYear getAcademicYearById(Long id);

    AcademicYear getActiveAcademicYear();

    AcademicYear updateAcademicYear(
            Long id,
            String name,
            LocalDate startDate,
            LocalDate endDate
    );

    AcademicYear activateAcademicYear(Long id);

    void deactivateAcademicYear(Long id);

    void deleteAcademicYear(Long id);
}