package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {

    boolean existsByGradeAndName(
            Grade grade,
            String name
    );

    Optional<Section> findByGradeAndName(
            Grade grade,
            String name
    );

    List<Section> findByGrade(
            Grade grade
    );

    List<Section> findByGradeAndActiveTrue(
            Grade grade
    );
}