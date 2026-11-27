package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.model.FacultyStudentResponse;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping(path = "/faculty/my-students", produces = "application/json")
@RequiredArgsConstructor
public class FacultyStudentsController {

    private final UserService userService;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final StudentEnrollmentRepository enrollmentRepository;

    @GetMapping
    @PreAuthorize("hasRole('FACULTY')")
    public List<FacultyStudentResponse> getMyStudents(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long sectionId
    ) {
        AcademicYear academicYear = academicYearId == null
                ? academicYearRepository.findByActiveTrue()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active academic year not found"))
                : academicYearRepository.findById(academicYearId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic year not found"));

        var faculty = userService.getPrincipal();
        List<Grade> authorizedGrades = gradeRepository.findActiveGradesAssignedToFaculty(academicYear, faculty);

        if (gradeId != null && authorizedGrades.stream().noneMatch(g -> g.getId().equals(gradeId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this Grade.");
        }

        return authorizedGrades.stream()
                .filter(g -> gradeId == null || g.getId().equals(gradeId))
                .flatMap(g -> enrollmentRepository
                        .findByAcademicYearAndGradeAndActiveTrue(academicYear, g)
                        .stream())
                .filter(e -> sectionId == null || e.getSection().getId().equals(sectionId))
                .map(this::toResponse)
                .sorted(Comparator.comparing(FacultyStudentResponse::getFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    private FacultyStudentResponse toResponse(StudentEnrollment enrollment) {
        var student = enrollment.getStudent();
        var grade = enrollment.getGrade();
        var section = enrollment.getSection();
        var year = enrollment.getAcademicYear();
        return FacultyStudentResponse.builder()
                .studentId(student.getId())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .countryCode(student.getCountryCode())
                .phoneNumber(student.getPhoneNumber())
                .academicYearId(year.getId())
                .academicYearName(year.getName())
                .gradeId(grade.getId())
                .gradeName(grade.getName())
                .sectionId(section.getId())
                .sectionName(section.getName())
                .enrollmentActive(enrollment.isActive())
                .build();
    }
}
