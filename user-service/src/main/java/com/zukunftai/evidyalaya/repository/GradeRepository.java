package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    boolean existsByAcademicYearAndName(AcademicYear academicYear, String name);
    Optional<Grade> findByAcademicYearAndName(AcademicYear academicYear, String name);
    List<Grade> findByAcademicYear(AcademicYear academicYear);
    List<Grade> findByAcademicYearAndActiveTrue(AcademicYear academicYear);

    @Query("""
        SELECT DISTINCT g FROM Grade g
        JOIN g.subjects s
        JOIN s.faculties f
        WHERE g.academicYear = :academicYear
          AND g.active = true
          AND s.active = true
          AND f = :faculty
        ORDER BY g.name
        """)
    List<Grade> findActiveGradesAssignedToFaculty(
            @Param("academicYear") AcademicYear academicYear,
            @Param("faculty") User faculty
    );
}
