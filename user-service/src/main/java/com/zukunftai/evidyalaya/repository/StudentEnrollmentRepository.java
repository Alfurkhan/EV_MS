package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.database.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentEnrollmentRepository
        extends JpaRepository<StudentEnrollment, Long> {

    /*
     * Check whether a student already has
     * an enrollment in a particular Academic Year.
     */
    boolean existsByStudentAndAcademicYear(
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
}