package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AcademicYearRepository
        extends JpaRepository<AcademicYear, Long> {

    boolean existsByName(String name);

    Optional<AcademicYear> findByName(String name);

    Optional<AcademicYear> findByActiveTrue();
}