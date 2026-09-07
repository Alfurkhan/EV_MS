package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.SubjectRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.service.SubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    private final UserRepository userRepository;

    private final GradeRepository gradeRepository;

    public SubjectServiceImpl(
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            GradeRepository gradeRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.gradeRepository = gradeRepository;
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
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new APIException(
                            "A subject with this name already exists.",
                            HttpStatus.CONFLICT,
                            "SUBJECT_NAME_ALREADY_EXISTS"
                    );
                });

        subjectRepository.findByCode(normalizedCode)
                .filter(existing -> !existing.getId().equals(id))
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
    public void assignSubjectToGrade(Long subjectId, Long gradeId) {

        Subject subject = getSubjectById(subjectId);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new APIException(
                        "Grade not found.",
                        HttpStatus.NOT_FOUND,
                        "GRADE_NOT_FOUND"
                ));

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
    public void removeSubjectFromGrade(Long subjectId, Long gradeId) {

        Subject subject = getSubjectById(subjectId);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new APIException(
                        "Grade not found.",
                        HttpStatus.NOT_FOUND,
                        "GRADE_NOT_FOUND"
                ));

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

        User currentUser = userRepository.findByUsername(
                getCurrentUsername()
        ).orElseThrow(() ->
                new APIException(
                        "Authenticated user not found.",
                        HttpStatus.NOT_FOUND,
                        "AUTHENTICATED_USER_NOT_FOUND"
                )
        );

        return subjectRepository.findByFacultiesContaining(currentUser);
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