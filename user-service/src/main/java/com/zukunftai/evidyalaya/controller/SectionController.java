package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.model.SectionRequest;
import com.zukunftai.evidyalaya.model.SectionResponse;
import com.zukunftai.evidyalaya.service.SectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        path = "/section",
        produces = "application/json"
)
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;


    /*
     * ============================================================
     * CREATE SECTION
     * ============================================================
     */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SectionResponse> createSection(
            @Valid @RequestBody SectionRequest request
    ) {

        Section section =
                sectionService.createSection(
                        request.getGradeId(),
                        request.getName(),
                        request.getDescription()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(section));
    }


    /*
     * ============================================================
     * GET ALL SECTIONS
     * ============================================================
     */

    @GetMapping
    public ResponseEntity<List<SectionResponse>> getAllSections() {

        List<SectionResponse> response =
                sectionService
                        .getAllSections()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET SECTIONS BY GRADE
     * ============================================================
     */

    @GetMapping("/grade/{gradeId}")
    public ResponseEntity<List<SectionResponse>>
    getSectionsByGrade(
            @PathVariable Long gradeId
    ) {

        List<SectionResponse> response =
                sectionService
                        .getSectionsByGrade(gradeId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET SECTION BY ID
     * ============================================================
     */

    @GetMapping("/id/{id}")
    public ResponseEntity<SectionResponse> getSection(
            @PathVariable Long id
    ) {

        Section section =
                sectionService.getSectionById(id);

        return ResponseEntity.ok(
                toResponse(section)
        );
    }


    /*
     * ============================================================
     * UPDATE SECTION
     * ============================================================
     */

    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SectionResponse> updateSection(
            @PathVariable Long id,
            @Valid @RequestBody SectionRequest request
    ) {

        /*
         * We use the existing Section's Grade.
         * A normal Section edit must not silently move
         * the Section to a different Grade.
         */

        Section existing =
                sectionService.getSectionById(id);

        Section section =
                sectionService.updateSection(
                        id,
                        request.getName(),
                        request.getDescription(),
                        existing.isActive()
                );

        return ResponseEntity.ok(
                toResponse(section)
        );
    }


    /*
     * ============================================================
     * ACTIVATE SECTION
     * ============================================================
     */

    @PutMapping("/id/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SectionResponse> activateSection(
            @PathVariable Long id
    ) {

        Section existing =
                sectionService.getSectionById(id);

        Section section =
                sectionService.updateSection(
                        id,
                        existing.getName(),
                        existing.getDescription(),
                        true
                );

        return ResponseEntity.ok(
                toResponse(section)
        );
    }


    /*
     * ============================================================
     * DEACTIVATE SECTION
     * ============================================================
     */

    @PutMapping("/id/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SectionResponse> deactivateSection(
            @PathVariable Long id
    ) {

        Section existing =
                sectionService.getSectionById(id);

        Section section =
                sectionService.updateSection(
                        id,
                        existing.getName(),
                        existing.getDescription(),
                        false
                );

        return ResponseEntity.ok(
                toResponse(section)
        );
    }


    /*
     * ============================================================
     * DELETE SECTION
     * ============================================================
     */

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSection(
            @PathVariable Long id
    ) {

        sectionService.deleteSection(id);

        return ResponseEntity.noContent().build();
    }


    /*
     * ============================================================
     * RESPONSE MAPPING
     * ============================================================
     */

    private SectionResponse toResponse(
            Section section
    ) {

        return SectionResponse.builder()
                .id(section.getId())

                .gradeId(
                        section.getGrade().getId()
                )

                .gradeName(
                        section.getGrade().getName()
                )

                .academicYearId(
                        section.getGrade()
                                .getAcademicYear()
                                .getId()
                )

                .academicYearName(
                        section.getGrade()
                                .getAcademicYear()
                                .getName()
                )

                .name(section.getName())

                .description(
                        section.getDescription()
                )

                .active(section.isActive())

                .createdAt(
                        section.getCreatedAt()
                )

                .updatedAt(
                        section.getUpdatedAt()
                )

                .build();
    }
}