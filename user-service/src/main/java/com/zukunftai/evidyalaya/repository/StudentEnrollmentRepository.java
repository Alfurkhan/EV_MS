package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentEnrollmentRepository
        extends JpaRepository<StudentEnrollment, Long> {

    /*
     * Check whether a student already has
     * an enrollment in a particular Academic Year.
     */
    boolean existsByStudentAndAcademicYearAndActiveTrue(
            User student,
            AcademicYear academicYear
    );


    /*
     * Find the enrollment of a student
     * for a particular Academic Year.
     */
    Optional<StudentEnrollment> findByStudentAndAcademicYear(
            User student,
            AcademicYear academicYear
    );


    /*
     * Get all enrollments for a student.
     *
     * Useful for viewing the student's
     * academic history.
     */
    List<StudentEnrollment> findByStudent(
            User student
    );


    /*
     * Get all students enrolled in a
     * particular Academic Year.
     */
    List<StudentEnrollment> findByAcademicYear(
            AcademicYear academicYear
    );


    /*
     * Get all students currently enrolled
     * in a particular Section.
     */
    List<StudentEnrollment> findBySection(
            Section section
    );


    /*
     * Get the active enrollment for a student.
     */
    Optional<StudentEnrollment>
    findByStudentAndAcademicYearAndActiveTrue(
            User student,
            AcademicYear academicYear
    );


    /*
     * Get active enrollments for an
     * Academic Year.
     */
    List<StudentEnrollment>
    findByAcademicYearAndActiveTrue(
            AcademicYear academicYear
    );


    /*
     * Get active enrollments for an
     * Academic Year, Grade, Section
     */
    List<StudentEnrollment>
    findByAcademicYearAndGradeAndSectionAndActiveTrue(
            AcademicYear academicYear,
            Grade grade,
            Section section
    );

    @Query("""
        SELECT COUNT(DISTINCT enrollment.student.id)
        FROM StudentEnrollment enrollment
        JOIN enrollment.grade grade
        JOIN grade.subjects subject
        JOIN subject.faculties faculty
        WHERE enrollment.academicYear.id = :academicYearId
          AND enrollment.active = true
          AND faculty.id = :facultyId
        """)
    long countDistinctActiveStudentsForFaculty(
            @Param("facultyId") Long facultyId,
            @Param("academicYearId") Long academicYearId
    );
}