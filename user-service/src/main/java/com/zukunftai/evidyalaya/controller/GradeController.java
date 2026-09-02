package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.model.GradeRequest;
import com.zukunftai.evidyalaya.model.GradeResponse;
import com.zukunftai.evidyalaya.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        path = "/grade",
        produces = "application/json"
)
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;


    /*
     * ============================================================
     * CREATE GRADE
     * ============================================================
     */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeResponse> createGrade(
            @Valid @RequestBody GradeRequest request
    ) {

        Grade grade =
                gradeService.createGrade(
                        request.getAcademicYearId(),
                        request.getName(),
                        request.getDescription()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(grade));
    }


    /*
     * ============================================================
     * GET ALL GRADES
     * ============================================================
     */

    @GetMapping
    public ResponseEntity<List<GradeResponse>> getAllGrades() {

        List<GradeResponse> response =
                gradeService
                        .getAllGrades()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET GRADES BY ACADEMIC YEAR
     * ============================================================
     */

    @GetMapping("/academic-year/{academicYearId}")
    public ResponseEntity<List<GradeResponse>>
    getGradesByAcademicYear(
            @PathVariable Long academicYearId
    ) {

        List<GradeResponse> response =
                gradeService
                        .getGradesByAcademicYear(
                                academicYearId
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET ONE GRADE
     * ============================================================
     */

    @GetMapping("/id/{id}")
    public ResponseEntity<GradeResponse> getGrade(
            @PathVariable Long id
    ) {

        Grade grade =
                gradeService.getGradeById(id);

        return ResponseEntity.ok(
                toResponse(grade)
        );
    }


    /*
     * ============================================================
     * UPDATE GRADE
     * ============================================================
     */

    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeResponse> updateGrade(
            @PathVariable Long id,
            @Valid @RequestBody GradeRequest request
    ) {

        Grade existingGrade =
                gradeService.getGradeById(id);

        Grade grade =
                gradeService.updateGrade(
                        id,
                        request.getName(),
                        request.getDescription(),
                        existingGrade.isActive()
                );

        return ResponseEntity.ok(
                toResponse(grade)
        );
    }

    /*
     * ============================================================
     * DEACTIVATE / ACTIVATE
     * ============================================================
     *
     * We keep the update API simple for now.
     * The current Grade service supports the active flag,
     * so the Admin can control it through a dedicated endpoint.
     */

    @PutMapping("/id/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeResponse> activateGrade(
            @PathVariable Long id
    ) {

        Grade existing =
                gradeService.getGradeById(id);

        Grade grade =
                gradeService.updateGrade(
                        id,
                        existing.getName(),
                        existing.getDescription(),
                        true
                );

        return ResponseEntity.ok(
                toResponse(grade)
        );
    }


    @PutMapping("/id/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeResponse> deactivateGrade(
            @PathVariable Long id
    ) {

        Grade existing =
                gradeService.getGradeById(id);

        Grade grade =
                gradeService.updateGrade(
                        id,
                        existing.getName(),
                        existing.getDescription(),
                        false
                );

        return ResponseEntity.ok(
                toResponse(grade)
        );
    }


    /*
     * ============================================================
     * DELETE GRADE
     * ============================================================
     */

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGrade(
            @PathVariable Long id
    ) {

        gradeService.deleteGrade(id);

        return ResponseEntity.noContent().build();
    }


    /*
     * ============================================================
     * RESPONSE MAPPING
     * ============================================================
     */

    private GradeResponse toResponse(
            Grade grade
    ) {

        return GradeResponse.builder()
                .id(grade.getId())
                .academicYearId(
                        grade.getAcademicYear().getId()
                )
                .academicYearName(
                        grade.getAcademicYear().getName()
                )
                .name(grade.getName())
                .description(grade.getDescription())
                .active(grade.isActive())
                .createdAt(grade.getCreatedAt())
                .updatedAt(grade.getUpdatedAt())
                .build();
    }
}