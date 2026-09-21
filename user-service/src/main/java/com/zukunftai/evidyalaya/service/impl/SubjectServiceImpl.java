package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.StudentSubjectResponse;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.SubjectRepository;
import com.zukunftai.evidyalaya.repository.TimetableRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.SubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    private final UserRepository userRepository;

    private final GradeRepository gradeRepository;

    private final AcademicYearRepository academicYearRepository;

    private final StudentEnrollmentRepository enrollmentRepository;

    private final TimetableRepository timetableRepository;


    public SubjectServiceImpl(
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            GradeRepository gradeRepository,
            AcademicYearRepository academicYearRepository,
            StudentEnrollmentRepository enrollmentRepository,
            TimetableRepository timetableRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.gradeRepository = gradeRepository;
        this.academicYearRepository = academicYearRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.timetableRepository = timetableRepository;
    }


    @Override
    public Subject createSubject(
            String name,
            String code,
            String description
    ) {

        String normalizedName = normalize(name);
        String normalizedCode = normalize(code);

        if (subjectRepository.existsByName(normalizedName)) {

            throw new APIException(
                    "A subject with this name already exists.",
                    HttpStatus.CONFLICT,
                    "SUBJECT_NAME_ALREADY_EXISTS"
            );
        }

        if (subjectRepository.existsByCode(normalizedCode)) {

            throw new APIException(
                    "A subject with this code already exists.",
                    HttpStatus.CONFLICT,
                    "SUBJECT_CODE_ALREADY_EXISTS"
            );
        }

        Instant now = Instant.now();

        Subject subject = Subject.builder()
                .name(normalizedName)
                .code(normalizedCode)
                .description(
                        description == null
                                ? null
                                : description.trim()
                )
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return subjectRepository.save(subject);
    }


    @Override
    @Transactional(readOnly = true)
    public List<Subject> getAllSubjects() {

        return subjectRepository.findAllWithFaculties();
    }


    @Override
    @Transactional(readOnly = true)
    public Subject getSubjectById(Long id) {

        return subjectRepository
                .findByIdWithFaculties(id)
                .orElseThrow(() ->
                        new APIException(
                                "Subject not found.",
                                HttpStatus.NOT_FOUND,
                                "SUBJECT_NOT_FOUND"
                        )
                );
    }


    @Override
    public Subject updateSubject(
            Long id,
            String name,
            String code,
            String description,
            boolean active
    ) {

        Subject subject = getSubjectById(id);

        String normalizedName = normalize(name);
        String normalizedCode = normalize(code);

        subjectRepository.findByName(normalizedName)
                .filter(existing ->
                        !existing.getId().equals(id)
                )
                .ifPresent(existing -> {
                    throw new APIException(
                            "A subject with this name already exists.",
                            HttpStatus.CONFLICT,
                            "SUBJECT_NAME_ALREADY_EXISTS"
                    );
                });

        subjectRepository.findByCode(normalizedCode)
                .filter(existing ->
                        !existing.getId().equals(id)
                )
                .ifPresent(existing -> {
                    throw new APIException(
                            "A subject with this code already exists.",
                            HttpStatus.CONFLICT,
                            "SUBJECT_CODE_ALREADY_EXISTS"
                    );
                });

        subject.setName(normalizedName);
        subject.setCode(normalizedCode);

        subject.setDescription(
                description == null
                        ? null
                        : description.trim()
        );

        subject.setActive(active);
        subject.setUpdatedAt(Instant.now());

        return subjectRepository.save(subject);
    }


    @Override
    public void deleteSubject(Long id) {

        Subject subject = getSubjectById(id);

        subjectRepository.delete(subject);
    }


    @Override
    public void assignFacultyToSubject(
            Long subjectId,
            Long facultyId
    ) {

        Subject subject =
                getSubjectById(subjectId);

        User faculty =
                userRepository.findById(facultyId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Faculty not found.",
                                        HttpStatus.NOT_FOUND,
                                        "FACULTY_NOT_FOUND"
                                )
                        );

        boolean isFaculty =
                faculty.getRoles() != null &&
                        faculty.getRoles()
                                .stream()
                                .anyMatch(role ->
                                        role.getName() ==
                                                RoleName.ROLE_FACULTY
                                );

        if (!isFaculty) {

            throw new APIException(
                    "The selected user is not a Faculty member.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_FACULTY"
            );
        }

        if (subject.getFaculties().contains(faculty)) {

            throw new APIException(
                    "This Faculty is already assigned to the subject.",
                    HttpStatus.CONFLICT,
                    "FACULTY_ALREADY_ASSIGNED"
            );
        }

        subject.getFaculties().add(faculty);

        subject.setUpdatedAt(Instant.now());

        subjectRepository.save(subject);
    }


    @Override
    public void removeFacultyFromSubject(
            Long subjectId,
            Long facultyId
    ) {

        Subject subject =
                getSubjectById(subjectId);

        User faculty =
                userRepository.findById(facultyId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Faculty not found.",
                                        HttpStatus.NOT_FOUND,
                                        "FACULTY_NOT_FOUND"
                                )
                        );

        if (!subject.getFaculties().remove(faculty)) {

            throw new APIException(
                    "This Faculty is not assigned to the subject.",
                    HttpStatus.NOT_FOUND,
                    "FACULTY_ASSIGNMENT_NOT_FOUND"
            );
        }

        subject.setUpdatedAt(Instant.now());

        subjectRepository.save(subject);
    }


    @Override
    public void assignSubjectToGrade(
            Long subjectId,
            Long gradeId
    ) {

        Subject subject = getSubjectById(subjectId);

        Grade grade =
                gradeRepository.findById(gradeId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Grade not found.",
                                        HttpStatus.NOT_FOUND,
                                        "GRADE_NOT_FOUND"
                                )
                        );

        if (grade.getSubjects().contains(subject)) {

            throw new APIException(
                    "This Subject is already assigned to the Grade.",
                    HttpStatus.CONFLICT,
                    "SUBJECT_ALREADY_ASSIGNED"
            );
        }

        grade.getSubjects().add(subject);

        gradeRepository.save(grade);
    }


    @Override
    public void removeSubjectFromGrade(
            Long subjectId,
            Long gradeId
    ) {

        Subject subject = getSubjectById(subjectId);

        Grade grade =
                gradeRepository.findById(gradeId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Grade not found.",
                                        HttpStatus.NOT_FOUND,
                                        "GRADE_NOT_FOUND"
                                )
                        );

        if (!grade.getSubjects().remove(subject)) {

            throw new APIException(
                    "This Subject is not assigned to the Grade.",
                    HttpStatus.NOT_FOUND,
                    "SUBJECT_GRADE_ASSIGNMENT_NOT_FOUND"
            );
        }

        gradeRepository.save(grade);
    }


    @Override
    @Transactional(readOnly = true)
    public List<Subject> getSubjectsForFaculty(
            Long facultyId
    ) {

        User faculty =
                userRepository.findById(facultyId)
                        .orElseThrow(() ->
                                new APIException(
                                        "Faculty not found.",
                                        HttpStatus.NOT_FOUND,
                                        "FACULTY_NOT_FOUND"
                                )
                        );

        return subjectRepository
                .findByFacultiesContaining(faculty);
    }


    @Override
    @Transactional(readOnly = true)
    public List<Subject> getSubjectsForGrade(
            Long gradeId
    ) {

        return subjectRepository.findByGradesId(gradeId);
    }


    @Override
    @Transactional(readOnly = true)
    public List<Subject> getMySubjects() {

        User currentUser =
                userRepository.findByUsername(
                        getCurrentUsername()
                ).orElseThrow(() ->
                        new APIException(
                                "Authenticated user not found.",
                                HttpStatus.NOT_FOUND,
                                "AUTHENTICATED_USER_NOT_FOUND"
                        )
                );

        return subjectRepository
                .findByFacultiesContaining(currentUser);
    }


    /*
     * ============================================================
     * STUDENT SUBJECTS
     * ============================================================
     *
     * Returns subjects assigned to the student's Grade.
     *
     * Faculty information is NOT taken from Subject.faculties.
     *
     * Instead, faculty information comes from the student's
     * actual timetable:
     *
     * Academic Year + Grade + Section + Subject -> Faculty
     *
     * This prevents a student from seeing every faculty who is
     * globally assigned to the subject.
     */
    @Override
    @Transactional(readOnly = true)
    public List<StudentSubjectResponse> getMyStudentSubjects() {

        User student =
                userRepository.findByUsername(
                        getCurrentUsername()
                ).orElseThrow(() ->
                        new APIException(
                                "Authenticated user not found.",
                                HttpStatus.NOT_FOUND,
                                "AUTHENTICATED_USER_NOT_FOUND"
                        )
                );

        /*
         * Verify that the authenticated user is actually a student.
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
                    "Only students can access their subjects.",
                    HttpStatus.FORBIDDEN,
                    "USER_IS_NOT_STUDENT"
            );
        }


        /*
         * Get the currently active Academic Year.
         */
        AcademicYear activeAcademicYear =
                academicYearRepository
                        .findByActiveTrue()
                        .orElseThrow(() ->
                                new APIException(
                                        "No active academic year found.",
                                        HttpStatus.NOT_FOUND,
                                        "ACTIVE_ACADEMIC_YEAR_NOT_FOUND"
                                )
                        );


        /*
         * Get the student's active enrollment.
         */
        StudentEnrollment enrollment =
                enrollmentRepository
                        .findByStudentAndAcademicYearAndActiveTrue(
                                student,
                                activeAcademicYear
                        )
                        .orElseThrow(() ->
                                new APIException(
                                        "You are not enrolled in the active academic year.",
                                        HttpStatus.NOT_FOUND,
                                        "STUDENT_ENROLLMENT_NOT_FOUND"
                                )
                        );


        Grade grade = enrollment.getGrade();

        Section section = enrollment.getSection();


        /*
         * Get the active timetable entries for this exact:
         *
         * Academic Year
         * Grade
         * Section
         */
        List<Timetable> timetableEntries =
                timetableRepository
                        .findByAcademicYearAndGradeAndSectionAndActiveTrue(
                                activeAcademicYear,
                                grade,
                                section
                        );


        /*
         * Build:
         *
         * Subject ID -> Faculty
         *
         * We deliberately reject conflicting faculty assignments
         * instead of silently choosing one.
         */
        Map<Long, User> subjectFacultyMap =
                new HashMap<>();


        for (Timetable timetable : timetableEntries) {

            Subject subject =
                    timetable.getSubject();

            User faculty =
                    timetable.getFaculty();

            Long subjectId =
                    subject.getId();

            User existingFaculty =
                    subjectFacultyMap.putIfAbsent(
                            subjectId,
                            faculty
                    );


            /*
             * Same subject + same student section but different
             * faculty = conflicting teaching assignment.
             */
            if (existingFaculty != null &&
                    !existingFaculty.getId()
                            .equals(faculty.getId())) {

                throw new APIException(
                        "Multiple faculties are assigned to subject '"
                                + subject.getName()
                                + "' for Grade "
                                + grade.getName()
                                + ", Section "
                                + section.getName()
                                + ".",
                        HttpStatus.CONFLICT,
                        "MULTIPLE_FACULTIES_FOR_STUDENT_SUBJECT"
                );
            }
        }


        /*
         * Start from the subjects assigned to the student's Grade.
         *
         * Therefore:
         *
         * Grade Subject
         *       +
         * Timetable Faculty
         *
         * gives the final StudentSubjectResponse.
         */
        return grade.getSubjects()
                .stream()
                .filter(Subject::isActive)
                .sorted(
                        Comparator.comparing(
                                Subject::getName,
                                String.CASE_INSENSITIVE_ORDER
                        )
                )
                .map(subject -> {

                    User faculty =
                            subjectFacultyMap.get(
                                    subject.getId()
                            );


                    StudentSubjectResponse.FacultySummary
                            facultySummary =
                            faculty == null
                                    ? null
                                    : StudentSubjectResponse
                                    .FacultySummary
                                    .builder()
                                    .id(faculty.getId())
                                    .fullName(
                                            faculty.getFullName()
                                    )
                                    .email(
                                            faculty.getEmail()
                                    )
                                    .build();


                    return StudentSubjectResponse.builder()
                            .id(subject.getId())
                            .name(subject.getName())
                            .code(subject.getCode())
                            .description(
                                    subject.getDescription()
                            )
                            .active(
                                    subject.isActive()
                            )
                            .faculty(
                                    facultySummary
                            )
                            .build();
                })
                .toList();
    }


    private String normalize(String value) {

        if (value == null || value.isBlank()) {

            throw new APIException(
                    "Subject name and code are required.",
                    HttpStatus.BAD_REQUEST,
                    "SUBJECT_NAME_CODE_REQUIRED"
            );
        }

        return value.trim();
    }


    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new APIException(
                    "User is not authenticated.",
                    HttpStatus.UNAUTHORIZED,
                    "USER_NOT_AUTHENTICATED"
            );
        }

        return authentication.getName();
    }
}