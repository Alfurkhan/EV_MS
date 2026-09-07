package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.SectionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.StudentEnrollmentService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class StudentEnrollmentServiceImpl
        implements StudentEnrollmentService {

    private final StudentEnrollmentRepository enrollmentRepository;

    private final UserRepository userRepository;

    private final AcademicYearRepository academicYearRepository;

    private final GradeRepository gradeRepository;

    private final SectionRepository sectionRepository;


    public StudentEnrollmentServiceImpl(
            StudentEnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository
    ) {

        this.enrollmentRepository =
                enrollmentRepository;

        this.userRepository =
                userRepository;

        this.academicYearRepository =
                academicYearRepository;

        this.gradeRepository =
                gradeRepository;

        this.sectionRepository =
                sectionRepository;
    }


    /*
     * ============================================================
     * CREATE ENROLLMENT
     * ============================================================
     */

    @Override
    public StudentEnrollment createEnrollment(
            Long studentId,
            Long academicYearId,
            Long gradeId,
            Long sectionId
    ) {

        /*
         * STEP 1
         * Find the User.
         */

        User student =
                userRepository.findById(studentId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Student not found.",
                                        HttpStatus.NOT_FOUND,
                                        "STUDENT_NOT_FOUND"
                                )
                        );


        /*
         * STEP 2
         * Make sure the selected User is actually
         * a Student.
         */

        boolean isStudent =
                student.getRoles() != null &&
                        student.getRoles()
                                .stream()
                                .anyMatch(role ->
                                        role.getName() ==
                                                RoleName.ROLE_STUDENT
                                );

        if (!isStudent) {

            throw new APIException(
                    "The selected user is not a Student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }


        /*
         * STEP 3
         * Find Academic Year.
         */

        AcademicYear academicYear =
                academicYearRepository
                        .findById(academicYearId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Academic year not found.",
                                        HttpStatus.NOT_FOUND,
                                        "ACADEMIC_YEAR_NOT_FOUND"
                                )
                        );


        /*
         * STEP 4
         * Find Grade.
         */

        Grade grade =
                gradeRepository.findById(gradeId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Grade not found.",
                                        HttpStatus.NOT_FOUND,
                                        "GRADE_NOT_FOUND"
                                )
                        );


        /*
         * STEP 5
         * Make sure Grade belongs to the
         * selected Academic Year.
         */

        if (!grade.getAcademicYear()
                .getId()
                .equals(academicYear.getId())) {

            throw new APIException(
                    "The selected Grade does not belong to the selected Academic Year.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_ACADEMIC_YEAR_MISMATCH"
            );
        }


        /*
         * STEP 6
         * Find Section.
         */

        Section section =
                sectionRepository.findById(sectionId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Section not found.",
                                        HttpStatus.NOT_FOUND,
                                        "SECTION_NOT_FOUND"
                                )
                        );


        /*
         * STEP 7
         * Make sure Section belongs to the
         * selected Grade.
         */

        if (!section.getGrade()
                .getId()
                .equals(grade.getId())) {

            throw new APIException(
                    "The selected Section does not belong to the selected Grade.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_GRADE_MISMATCH"
            );
        }

        /*
         * STEP 8
         * New enrollments can only be created
         * under active academic structures.
         */

        if (!academicYear.isActive()) {

            throw new APIException(
                    "The selected Academic Year is not active.",
                    HttpStatus.BAD_REQUEST,
                    "ACADEMIC_YEAR_INACTIVE"
            );
        }

        if (!grade.isActive()) {

            throw new APIException(
                    "The selected Grade is not active.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_INACTIVE"
            );
        }

        if (!section.isActive()) {

            throw new APIException(
                    "The selected Section is not active.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_INACTIVE"
            );
        }

        /*
         * STEP 9
         * Check whether the student already has
         * an ACTIVE enrollment in this Academic Year.
         */

        if (
                enrollmentRepository
                        .existsByStudentAndAcademicYearAndActiveTrue(
                                student,
                                academicYear
                        )
        ) {

            throw new APIException(
                    "The Student already has an active enrollment in this academic year.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_ENROLLED"
            );
        }


        /*
         * STEP 10
         * Create enrollment.
         */

        Instant now =
                Instant.now();

        StudentEnrollment enrollment =
                StudentEnrollment.builder()
                        .student(student)
                        .academicYear(academicYear)
                        .grade(grade)
                        .section(section)
                        .active(true)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();


        return enrollmentRepository.save(
                enrollment
        );
    }

    /*
     * ============================================================
     * UPDATE ENROLLMENT
     * ============================================================
     */

    @Override
    public StudentEnrollment updateEnrollment(
            Long id,
            Long gradeId,
            Long sectionId
    ) {

        /*
         * STEP 1
         * Find the existing enrollment.
         */
        StudentEnrollment enrollment =
                getEnrollmentById(id);


        /*
         * STEP 2
         * Find the selected Grade.
         */
        Grade grade =
                gradeRepository.findById(gradeId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Grade not found.",
                                        HttpStatus.NOT_FOUND,
                                        "GRADE_NOT_FOUND"
                                )
                        );


        /*
         * STEP 3
         * Make sure the Grade belongs to
         * the same Academic Year as the enrollment.
         */
        if (!grade.getAcademicYear()
                .getId()
                .equals(enrollment.getAcademicYear().getId())) {

            throw new APIException(
                    "The selected Grade does not belong to the enrollment's Academic Year.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_ACADEMIC_YEAR_MISMATCH"
            );
        }


        /*
         * STEP 4
         * Find the selected Section.
         */
        Section section =
                sectionRepository.findById(sectionId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Section not found.",
                                        HttpStatus.NOT_FOUND,
                                        "SECTION_NOT_FOUND"
                                )
                        );


        /*
         * STEP 5
         * Make sure Section belongs to
         * the selected Grade.
         */
        if (!section.getGrade()
                .getId()
                .equals(grade.getId())) {

            throw new APIException(
                    "The selected Section does not belong to the selected Grade.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_GRADE_MISMATCH"
            );
        }


        /*
         * STEP 6
         * Grade and Section must be active.
         */
        if (!grade.isActive()) {

            throw new APIException(
                    "The selected Grade is not active.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_INACTIVE"
            );
        }

        if (!section.isActive()) {

            throw new APIException(
                    "The selected Section is not active.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_INACTIVE"
            );
        }


        /*
         * STEP 7
         * Update the existing enrollment.
         *
         * Student and Academic Year remain unchanged.
         */
        enrollment.setGrade(grade);
        enrollment.setSection(section);

        enrollment.setUpdatedAt(
                Instant.now()
        );


        /*
         * STEP 8
         * Save the same enrollment row.
         */
        return enrollmentRepository.save(
                enrollment
        );
    }

    /*
     * ============================================================
     * GET ALL ENROLLMENTS
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<StudentEnrollment> getAllEnrollments() {

        return enrollmentRepository.findAll();
    }


    /*
     * ============================================================
     * GET BY STUDENT
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<StudentEnrollment> getEnrollmentsByStudent(
            Long studentId
    ) {

        User student =
                getStudentById(studentId);

        return enrollmentRepository.findByStudent(
                student
        );
    }


    /*
     * ============================================================
     * GET BY ACADEMIC YEAR
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<StudentEnrollment>
    getEnrollmentsByAcademicYear(
            Long academicYearId
    ) {

        AcademicYear academicYear =
                getAcademicYearById(
                        academicYearId
                );

        return enrollmentRepository
                .findByAcademicYear(
                        academicYear
                );
    }


    /*
     * ============================================================
     * GET BY SECTION
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<StudentEnrollment>
    getEnrollmentsBySection(
            Long sectionId
    ) {

        Section section =
                getSectionById(
                        sectionId
                );

        return enrollmentRepository.findBySection(
                section
        );
    }


    /*
     * ============================================================
     * GET BY ID
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public StudentEnrollment getEnrollmentById(
            Long id
    ) {

        return enrollmentRepository
                .findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Student enrollment not found.",
                                HttpStatus.NOT_FOUND,
                                "STUDENT_ENROLLMENT_NOT_FOUND"
                        )
                );
    }


    /*
     * ============================================================
     * GET ACTIVE ENROLLMENT
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public StudentEnrollment
    getActiveEnrollmentForStudent(
            Long studentId,
            Long academicYearId
    ) {

        User student =
                getStudentById(
                        studentId
                );

        AcademicYear academicYear =
                getAcademicYearById(
                        academicYearId
                );

        return enrollmentRepository
                .findByStudentAndAcademicYearAndActiveTrue(
                        student,
                        academicYear
                )
                .orElseThrow(() ->
                        new APIException(
                                "No active enrollment found for the Student in this academic year.",
                                HttpStatus.NOT_FOUND,
                                "ACTIVE_STUDENT_ENROLLMENT_NOT_FOUND"
                        )
                );
    }


    /*
     * ============================================================
     * DEACTIVATE ENROLLMENT
     * ============================================================
     */

    @Override
    public void deactivateEnrollment(
            Long id
    ) {

        StudentEnrollment enrollment =
                getEnrollmentById(id);

        enrollment.setActive(false);

        enrollment.setUpdatedAt(
                Instant.now()
        );

        enrollmentRepository.save(
                enrollment
        );
    }

    /*
     * ============================================================
     * ACTIVATE ENROLLMENT
     * ============================================================
     */

    @Override
    public void activateEnrollment(
            Long id
    ) {

        StudentEnrollment enrollment =
                getEnrollmentById(id);

        /*
         * If the enrollment is already active,
         * there is nothing to do.
         */
        if (enrollment.isActive()) {
            return;
        }

        /*
         * Check whether the student already has
         * another active enrollment in this
         * academic year.
         */
        boolean alreadyHasActiveEnrollment =
                enrollmentRepository
                        .existsByStudentAndAcademicYearAndActiveTrue(
                                enrollment.getStudent(),
                                enrollment.getAcademicYear()
                        );

        if (alreadyHasActiveEnrollment) {

            throw new APIException(
                    "The Student already has another active enrollment in this academic year.",
                    HttpStatus.CONFLICT,
                    "STUDENT_ALREADY_ENROLLED"
            );
        }

        enrollment.setActive(true);

        enrollment.setUpdatedAt(
                Instant.now()
        );

        enrollmentRepository.save(
                enrollment
        );
    }

    /*
     * ============================================================
     * DELETE ENROLLMENT
     * ============================================================
     */

    @Override
    public void deleteEnrollment(
            Long id
    ) {

        StudentEnrollment enrollment =
                getEnrollmentById(id);

        enrollmentRepository.delete(
                enrollment
        );
    }


    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    private User getStudentById(
            Long studentId
    ) {

        User student =
                userRepository.findById(
                                studentId
                        )
                        .orElseThrow(() ->
                                new APIException(
                                        "Student not found.",
                                        HttpStatus.NOT_FOUND,
                                        "STUDENT_NOT_FOUND"
                                )
                        );


        boolean isStudent =
                student.getRoles() != null &&
                        student.getRoles()
                                .stream()
                                .anyMatch(role ->
                                        role.getName() ==
                                                RoleName.ROLE_STUDENT
                                );

        if (!isStudent) {

            throw new APIException(
                    "The selected user is not a Student.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_STUDENT"
            );
        }

        return student;
    }


    private AcademicYear getAcademicYearById(
            Long id
    ) {

        return academicYearRepository
                .findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Academic year not found.",
                                HttpStatus.NOT_FOUND,
                                "ACADEMIC_YEAR_NOT_FOUND"
                        )
                );
    }


    private Section getSectionById(
            Long id
    ) {

        return sectionRepository
                .findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Section not found.",
                                HttpStatus.NOT_FOUND,
                                "SECTION_NOT_FOUND"
                        )
                );
    }
}