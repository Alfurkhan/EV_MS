package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.StudentEnrollment;

import java.util.List;

public interface StudentEnrollmentService {

    StudentEnrollment createEnrollment(
            Long studentId,
            Long academicYearId,
            Long gradeId,
            Long sectionId
    );

    StudentEnrollment updateEnrollment(
            Long id,
            Long gradeId,
            Long sectionId
    );

    List<StudentEnrollment> getAllEnrollments();

    List<StudentEnrollment> getEnrollmentsByStudent(
            Long studentId
    );

    List<StudentEnrollment> getEnrollmentsByAcademicYear(
            Long academicYearId
    );

    List<StudentEnrollment> getEnrollmentsBySection(
            Long sectionId
    );

    StudentEnrollment getEnrollmentById(
            Long id
    );

    StudentEnrollment getActiveEnrollmentForStudent(
            Long studentId,
            Long academicYearId
    );

    void deactivateEnrollment(
            Long id
    );

    void activateEnrollment(
            Long id
    );

    void deleteEnrollment(
            Long id
    );
}