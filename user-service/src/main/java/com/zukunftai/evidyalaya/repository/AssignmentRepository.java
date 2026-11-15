package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByFacultyOrderByCreatedAtDesc(User faculty);
    List<Assignment> findByFacultyAndStatusOrderByCreatedAtDesc(User faculty, AssignmentStatus status);
    List<Assignment> findByAcademicYearAndGradeAndSectionAndStatusOrderByDueAtAsc(
            AcademicYear academicYear, Grade grade, Section section, AssignmentStatus status);
    Optional<Assignment> findByIdAndFaculty(Long id, User faculty);
    List<Assignment> findAllByOrderByCreatedAtDesc();
}
