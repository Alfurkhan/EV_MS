package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {

    boolean existsByAcademicYearAndName(
            AcademicYear academicYear,
            String name
    );

    Optional<Grade> findByAcademicYearAndName(
            AcademicYear academicYear,
            String name
    );

    List<Grade> findByAcademicYear(
            AcademicYear academicYear
    );

    List<Grade> findByAcademicYearAndActiveTrue(
            AcademicYear academicYear
    );
}