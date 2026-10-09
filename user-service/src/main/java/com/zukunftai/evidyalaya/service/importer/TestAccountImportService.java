package com.zukunftai.evidyalaya.service.importer;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.RoleRepository;
import com.zukunftai.evidyalaya.repository.SectionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.SubjectRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.SubjectService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class TestAccountImportService {

    private static final String INDIA_COUNTRY_CODE = "+91";

    private final TestAccountExcelImporter excelImporter;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final SubjectService subjectService;
    private final PasswordEncoder passwordEncoder;

    public TestAccountImportService(
            TestAccountExcelImporter excelImporter,
            UserRepository userRepository,
            RoleRepository roleRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            StudentEnrollmentRepository studentEnrollmentRepository,
            SubjectService subjectService,
            PasswordEncoder passwordEncoder
    ) {
        this.excelImporter = excelImporter;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.subjectService = subjectService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TestAccountImportResult importAccounts(
            MultipartFile file
    ) {

        List<TestAccountExcelRow> rows =
                excelImporter.read(file);

        validateDatabaseState(rows);

        TestAccountImportResult result =
                new TestAccountImportResult();

        Map<String, User> createdUsersByEmail =
                new HashMap<>();

        createStudents(
                rows,
                result,
                createdUsersByEmail
        );

        createFaculties(
                rows,
                result,
                createdUsersByEmail
        );

        configureFacultyAssignments(
                rows,
                createdUsersByEmail
        );

        return result;
    }

    private void validateDatabaseState(
            List<TestAccountExcelRow> rows
    ) {

        Set<String> emailsInExcel =
                new HashSet<>();

        Set<String> phoneNumbersInExcel =
                new HashSet<>();

        for (TestAccountExcelRow row : rows) {

            String email =
                    normalizeEmail(row.getEmail());

            String phone =
                    row.getMobile().trim();

            if (!emailsInExcel.add(email)) {

                throw new TestAccountImportException(
                        "Duplicate email found in Excel: " +
                                row.getEmail()
                );
            }

            if (!phoneNumbersInExcel.add(phone)) {

                throw new TestAccountImportException(
                        "Duplicate mobile number found in Excel: " +
                                row.getMobile()
                );
            }

            if (userRepository.findByEmail(email).isPresent()) {

                throw new TestAccountImportException(
                        "User already exists with email: " +
                                email
                );
            }

            if (userRepository.existsByPhoneNumber(phone)) {

                throw new TestAccountImportException(
                        "User already exists with mobile number: " +
                                phone
                );
            }

            AcademicYear academicYear =
                    findAcademicYear(row);

            Grade grade =
                    findGrade(
                            academicYear,
                            row.getGrade()
                    );

            Section section =
                    findSection(
                            grade,
                            row.getSection()
                    );

            if ("Students".equals(row.getSheetName())) {

                validateStudentEnrollment(
                        academicYear,
                        row,
                        email,
                        grade,
                        section
                );
            }

            if ("Faculties".equals(row.getSheetName())) {

                validateFacultySubjects(
                        row
                );
            }
        }
    }

    private void validateStudentEnrollment(
            AcademicYear academicYear,
            TestAccountExcelRow row,
            String email,
            Grade grade,
            Section section
    ) {

        User existingStudent =
                userRepository.findByEmail(email)
                        .orElse(null);

        if (existingStudent != null &&
                studentEnrollmentRepository
                        .findByStudentAndAcademicYear(
                                existingStudent,
                                academicYear
                        )
                        .isPresent()) {

            throw new TestAccountImportException(
                    "Student already has an enrollment for " +
                            academicYear.getName() +
                            ": " +
                            email
            );
        }
    }

    private void validateFacultySubjects(
            TestAccountExcelRow row
    ) {

        String subjects = row.getSubjects();

        if (subjects == null || subjects.isBlank()) {
            throw new TestAccountImportException(
                    "Faculty " +
                            row.getEmail() +
                            " has no subject assignments."
            );
        }

        AcademicYear academicYear =
                findAcademicYear(row);

        String[] assignments = subjects.split(";");

        for (String assignment : assignments) {

            String trimmedAssignment =
                    assignment.trim();

            if (trimmedAssignment.isBlank()) {
                continue;
            }

            FacultyAssignment parsed =
                    parseFacultyAssignment(
                            trimmedAssignment,
                            row
                    );

            Grade grade =
                    findGrade(
                            academicYear,
                            parsed.grade()
                    );

            // Make sure the section from the Excel assignment
            // actually belongs to this grade.
            findSection(
                    grade,
                    parsed.section()
            );

            // Make sure the subject actually exists.
            subjectRepository
                    .findByName(parsed.subject())
                    .orElseThrow(() ->
                            new TestAccountImportException(
                                    "Subject not found: " +
                                            parsed.subject() +
                                            " for faculty " +
                                            row.getEmail()
                            )
                    );
        }
    }

    private void createStudents(
            List<TestAccountExcelRow> rows,
            TestAccountImportResult result,
            Map<String, User> createdUsersByEmail
    ) {

        Role studentRole =
                getRequiredRole(
                        RoleName.ROLE_STUDENT
                );

        for (TestAccountExcelRow row : rows) {

            if (!"Students".equals(
                    row.getSheetName()
            )) {
                continue;
            }

            AcademicYear academicYear =
                    findAcademicYear(row);

            Grade grade =
                    findGrade(
                            academicYear,
                            row.getGrade()
                    );

            Section section =
                    findSection(
                            grade,
                            row.getSection()
                    );

            User student =
                    createUser(
                            row,
                            studentRole
                    );

            createdUsersByEmail.put(
                    normalizeEmail(row.getEmail()),
                    student
            );

            StudentEnrollment enrollment =
                    StudentEnrollment.builder()
                            .student(student)
                            .academicYear(academicYear)
                            .grade(grade)
                            .section(section)
                            .active(true)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();

            studentEnrollmentRepository.save(
                    enrollment
            );

            result.incrementStudentsCreated();
        }
    }

    private void createFaculties(
            List<TestAccountExcelRow> rows,
            TestAccountImportResult result,
            Map<String, User> createdUsersByEmail
    ) {

        Role facultyRole =
                getRequiredRole(
                        RoleName.ROLE_FACULTY
                );

        for (TestAccountExcelRow row : rows) {

            if (!"Faculties".equals(
                    row.getSheetName()
            )) {
                continue;
            }

            User faculty =
                    createUser(
                            row,
                            facultyRole
                    );

            createdUsersByEmail.put(
                    normalizeEmail(row.getEmail()),
                    faculty
            );

            result.incrementFacultiesCreated();
        }
    }

    private User createUser(
            TestAccountExcelRow row,
            Role role
    ) {

        String email =
                normalizeEmail(row.getEmail());

        User user =
                new User(
                        email,
                        email,
                        row.getPassword()
                );

        user.setPassword(
                passwordEncoder.encode(
                        row.getPassword()
                )
        );

        user.setRoles(
                new HashSet<>(
                        Set.of(role)
                )
        );

        user.setFullName(
                row.getName()
        );

        user.setCountryCode(
                INDIA_COUNTRY_CODE
        );

        user.setPhoneNumber(
                row.getMobile().trim()
        );

        Instant now =
                Instant.now();

        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setLastLoginAt(now);

        user.setAccountEnabled(true);
        user.setAccountLocked(false);
        user.setAccountDeleted(false);
        user.setEmailVerified(true);
        user.setTermPolicyViewed(false);

        user.setRegisteredSource(
                com.zukunftai.evidyalaya.model.RegisteredSource.NONE
        );

        User savedUser =
                userRepository.saveAndFlush(user);

        savedUser.setRootId(
                savedUser.getId()
        );

        return userRepository.saveAndFlush(
                savedUser
        );
    }

    private void configureFacultyAssignments(
            List<TestAccountExcelRow> rows,
            Map<String, User> createdUsersByEmail
    ) {

        for (TestAccountExcelRow row : rows) {

            if (!"Faculties".equals(row.getSheetName())) {
                continue;
            }

            User faculty =
                    createdUsersByEmail.get(
                            normalizeEmail(row.getEmail())
                    );

            if (faculty == null) {
                throw new TestAccountImportException(
                        "Faculty user was not created: " +
                                row.getEmail()
                );
            }

            AcademicYear academicYear =
                    findAcademicYear(row);

            String[] assignments =
                    row.getSubjects().split(";");

            for (String assignment : assignments) {

                String trimmedAssignment =
                        assignment.trim();

                if (trimmedAssignment.isBlank()) {
                    continue;
                }

                FacultyAssignment parsed =
                        parseFacultyAssignment(
                                trimmedAssignment,
                                row
                        );

                Grade grade =
                        findGrade(
                                academicYear,
                                parsed.grade()
                        );

                // Validate the exact section as well.
                findSection(
                        grade,
                        parsed.section()
                );

                Subject subject =
                        subjectRepository
                                .findByName(parsed.subject())
                                .orElseThrow(() ->
                                        new TestAccountImportException(
                                                "Subject not found: " +
                                                        parsed.subject()
                                        )
                                );

                /*
                 * Assign Subject → Grade only when it does not
                 * already exist.
                 */
                if (!grade.getSubjects().contains(subject)) {

                    subjectService.assignSubjectToGrade(
                            subject.getId(),
                            grade.getId()
                    );
                }

                /*
                 * Assign Faculty → Subject only when it does not
                 * already exist.
                 */
                if (!subject.getFaculties().contains(faculty)) {

                    subjectService.assignFacultyToSubject(
                            subject.getId(),
                            faculty.getId()
                    );
                }
            }
        }
    }

    private FacultyAssignment parseFacultyAssignment(
            String assignment,
            TestAccountExcelRow row
    ) {

        int colonIndex =
                assignment.indexOf(':');

        if (colonIndex <= 0 ||
                colonIndex == assignment.length() - 1) {

            throw new TestAccountImportException(
                    "Invalid faculty assignment format for " +
                            row.getEmail() +
                            ": " +
                            assignment +
                            ". Expected format: Grade 10-A: Subject"
            );
        }

        String gradeSection =
                assignment
                        .substring(
                                0,
                                colonIndex
                        )
                        .trim();

        String subjectName =
                assignment
                        .substring(
                                colonIndex + 1
                        )
                        .trim();

        if (!gradeSection.startsWith(
                "Grade "
        )) {

            throw new TestAccountImportException(
                    "Invalid grade format in faculty assignment: " +
                            assignment
            );
        }

        String gradeAndSection =
                gradeSection
                        .substring(
                                "Grade ".length()
                        )
                        .trim();

        int dashIndex =
                gradeAndSection.indexOf('-');

        if (dashIndex <= 0 ||
                dashIndex == gradeAndSection.length() - 1) {

            throw new TestAccountImportException(
                    "Invalid grade/section format in faculty assignment: " +
                            assignment
            );
        }

        String grade =
                gradeAndSection
                        .substring(
                                0,
                                dashIndex
                        )
                        .trim();

        String section =
                gradeAndSection
                        .substring(
                                dashIndex + 1
                        )
                        .trim();

        if (grade.isBlank() ||
                section.isBlank() ||
                subjectName.isBlank()) {

            throw new TestAccountImportException(
                    "Invalid faculty assignment: " +
                            assignment
            );
        }

        return new FacultyAssignment(
                grade,
                section,
                subjectName
        );
    }

    private AcademicYear findAcademicYear(
            TestAccountExcelRow row
    ) {

        return academicYearRepository
                .findByName(
                        row.getAcademicYear().trim()
                )
                .orElseThrow(() ->
                        new TestAccountImportException(
                                "Academic Year not found: " +
                                        row.getAcademicYear() +
                                        " for " +
                                        row.getEmail()
                        )
                );
    }

    private Grade findGrade(
            AcademicYear academicYear,
            String gradeName
    ) {

        return gradeRepository
                .findByAcademicYearAndName(
                        academicYear,
                        gradeName.trim()
                )
                .orElseThrow(() ->
                        new TestAccountImportException(
                                "Grade not found: " +
                                        gradeName +
                                        " for Academic Year " +
                                        academicYear.getName()
                        )
                );
    }

    private Section findSection(
            Grade grade,
            String sectionName
    ) {

        return sectionRepository
                .findByGradeAndName(
                        grade,
                        sectionName.trim()
                )
                .orElseThrow(() ->
                        new TestAccountImportException(
                                "Section not found: " +
                                        sectionName +
                                        " for Grade " +
                                        grade.getName()
                        )
                );
    }

    private Role getRequiredRole(
            RoleName roleName
    ) {

        return roleRepository
                .findByName(roleName)
                .orElseThrow(() ->
                        new TestAccountImportException(
                                "Required role not found: " +
                                        roleName
                        )
                );
    }

    private String normalizeEmail(
            String email
    ) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private record FacultyAssignment(
            String grade,
            String section,
            String subject
    ) {
    }
}