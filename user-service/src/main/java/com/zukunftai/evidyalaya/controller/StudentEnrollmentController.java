package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.config.UserPrincipal;
import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.model.StudentEnrollmentRequest;
import com.zukunftai.evidyalaya.model.StudentEnrollmentResponse;
import com.zukunftai.evidyalaya.service.AcademicYearService;
import com.zukunftai.evidyalaya.service.StudentEnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        path = "/student-enrollment",
        produces = "application/json"
)
@RequiredArgsConstructor
public class StudentEnrollmentController {

    private final StudentEnrollmentService enrollmentService;

    private final AcademicYearService academicYearService;


    /*
     * ============================================================
     * CREATE ENROLLMENT
     * ============================================================
     */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentEnrollmentResponse> createEnrollment(
            @Valid @RequestBody StudentEnrollmentRequest request
    ) {

        StudentEnrollment enrollment =
                enrollmentService.createEnrollment(
                        request.getStudentId(),
                        request.getAcademicYearId(),
                        request.getGradeId(),
                        request.getSectionId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(enrollment));
    }


    /*
     * ============================================================
     * UPDATE ENROLLMENT
     * ============================================================
     */

    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentEnrollmentResponse> updateEnrollment(
            @PathVariable Long id,
            @Valid @RequestBody StudentEnrollmentRequest request
    ) {

        StudentEnrollment enrollment =
                enrollmentService.updateEnrollment(
                        id,
                        request.getGradeId(),
                        request.getSectionId()
                );

        return ResponseEntity.ok(
                toResponse(enrollment)
        );
    }


    /*
     * ============================================================
     * GET ALL ENROLLMENTS
     * ============================================================
     */

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentEnrollmentResponse>>
    getAllEnrollments() {

        List<StudentEnrollmentResponse> response =
                enrollmentService
                        .getAllEnrollments()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET ENROLLMENTS BY STUDENT
     * ============================================================
     */

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentEnrollmentResponse>>
    getEnrollmentsByStudent(
            @PathVariable Long studentId
    ) {

        List<StudentEnrollmentResponse> response =
                enrollmentService
                        .getEnrollmentsByStudent(studentId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET ENROLLMENTS BY ACADEMIC YEAR
     * ============================================================
     */

    @GetMapping("/academic-year/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentEnrollmentResponse>>
    getEnrollmentsByAcademicYear(
            @PathVariable Long academicYearId
    ) {

        List<StudentEnrollmentResponse> response =
                enrollmentService
                        .getEnrollmentsByAcademicYear(
                                academicYearId
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET ENROLLMENTS BY SECTION
     * ============================================================
     */

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentEnrollmentResponse>>
    getEnrollmentsBySection(
            @PathVariable Long sectionId
    ) {

        List<StudentEnrollmentResponse> response =
                enrollmentService
                        .getEnrollmentsBySection(
                                sectionId
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET ENROLLMENT BY ID
     * ============================================================
     */

    @GetMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentEnrollmentResponse>
    getEnrollment(
            @PathVariable Long id
    ) {

        StudentEnrollment enrollment =
                enrollmentService.getEnrollmentById(id);

        return ResponseEntity.ok(
                toResponse(enrollment)
        );
    }


    /*
     * ============================================================
     * GET MY ACTIVE ENROLLMENT
     * ============================================================
     *
     * The student ID is taken from the authenticated JWT
     * through UserPrincipal.
     *
     * The client does NOT provide a student ID.
     *
     */

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentEnrollmentResponse>
    getMyActiveEnrollment(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {

        AcademicYear activeAcademicYear =
                academicYearService.getActiveAcademicYear();

        StudentEnrollment enrollment =
                enrollmentService.getActiveEnrollmentForStudent(
                        userPrincipal.getId(),
                        activeAcademicYear.getId()
                );

        return ResponseEntity.ok(
                toResponse(enrollment)
        );
    }


    /*
     * ============================================================
     * GET ACTIVE ENROLLMENT FOR STUDENT
     * ============================================================
     */

    @GetMapping("/student/{studentId}/academic-year/{academicYearId}/active")
    public ResponseEntity<StudentEnrollmentResponse>
    getActiveEnrollment(
            @PathVariable Long studentId,
            @PathVariable Long academicYearId
    ) {

        StudentEnrollment enrollment =
                enrollmentService
                        .getActiveEnrollmentForStudent(
                                studentId,
                                academicYearId
                        );

        return ResponseEntity.ok(
                toResponse(enrollment)
        );
    }


    /*
     * ============================================================
     * DEACTIVATE ENROLLMENT
     * ============================================================
     */

    @PutMapping("/id/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentEnrollmentResponse>
    deactivateEnrollment(
            @PathVariable Long id
    ) {

        enrollmentService.deactivateEnrollment(id);

        return ResponseEntity.ok(
                toResponse(
                        enrollmentService
                                .getEnrollmentById(id)
                )
        );
    }


    /*
     * ============================================================
     * ACTIVATE ENROLLMENT
     * ============================================================
     */

    @PutMapping("/id/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentEnrollmentResponse>
    activateEnrollment(
            @PathVariable Long id
    ) {

        enrollmentService.activateEnrollment(id);

        return ResponseEntity.ok(
                toResponse(
                        enrollmentService
                                .getEnrollmentById(id)
                )
        );
    }


    /*
     * ============================================================
     * DELETE ENROLLMENT
     * ============================================================
     */

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEnrollment(
            @PathVariable Long id
    ) {

        enrollmentService.deleteEnrollment(id);

        return ResponseEntity.noContent().build();
    }


    /*
     * ============================================================
     * RESPONSE MAPPING
     * ============================================================
     */

    private StudentEnrollmentResponse toResponse(
            StudentEnrollment enrollment
    ) {

        return StudentEnrollmentResponse.builder()

                .id(enrollment.getId())

                .studentId(
                        enrollment.getStudent()
                                .getId()
                )

                .studentName(
                        enrollment.getStudent()
                                .getFullName()
                )

                .studentEmail(
                        enrollment.getStudent()
                                .getEmail()
                )

                .academicYearId(
                        enrollment.getAcademicYear()
                                .getId()
                )

                .academicYearName(
                        enrollment.getAcademicYear()
                                .getName()
                )

                .gradeId(
                        enrollment.getGrade()
                                .getId()
                )

                .gradeName(
                        enrollment.getGrade()
                                .getName()
                )

                .sectionId(
                        enrollment.getSection()
                                .getId()
                )

                .sectionName(
                        enrollment.getSection()
                                .getName()
                )

                .active(
                        enrollment.isActive()
                )

                .createdAt(
                        enrollment.getCreatedAt()
                )

                .updatedAt(
                        enrollment.getUpdatedAt()
                )

                .build();
    }
}