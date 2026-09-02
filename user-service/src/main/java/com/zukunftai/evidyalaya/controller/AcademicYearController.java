package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.model.AcademicYearRequest;
import com.zukunftai.evidyalaya.model.AcademicYearResponse;
import com.zukunftai.evidyalaya.service.AcademicYearService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        path = "/academic-year",
        produces = "application/json"
)
@RequiredArgsConstructor
public class AcademicYearController {

    private final AcademicYearService academicYearService;


    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicYearResponse> createAcademicYear(
            @Valid @RequestBody AcademicYearRequest request
    ) {

        AcademicYear academicYear =
                academicYearService.createAcademicYear(
                        request.getName(),
                        request.getStartDate(),
                        request.getEndDate()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(academicYear));
    }


    @GetMapping
    public ResponseEntity<List<AcademicYearResponse>>
    getAllAcademicYears() {

        List<AcademicYearResponse> response =
                academicYearService
                        .getAllAcademicYears()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    @GetMapping("/id/{id}")
    public ResponseEntity<AcademicYearResponse>
    getAcademicYear(
            @PathVariable Long id
    ) {

        AcademicYear academicYear =
                academicYearService
                        .getAcademicYearById(id);

        return ResponseEntity.ok(
                toResponse(academicYear)
        );
    }


    @GetMapping("/active")
    public ResponseEntity<AcademicYearResponse>
    getActiveAcademicYear() {

        AcademicYear academicYear =
                academicYearService
                        .getActiveAcademicYear();

        return ResponseEntity.ok(
                toResponse(academicYear)
        );
    }


    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicYearResponse>
    updateAcademicYear(
            @PathVariable Long id,
            @Valid @RequestBody AcademicYearRequest request
    ) {

        AcademicYear academicYear =
                academicYearService.updateAcademicYear(
                        id,
                        request.getName(),
                        request.getStartDate(),
                        request.getEndDate()
                );

        return ResponseEntity.ok(
                toResponse(academicYear)
        );
    }


    @PutMapping("/id/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicYearResponse>
    activateAcademicYear(
            @PathVariable Long id
    ) {

        AcademicYear academicYear =
                academicYearService.activateAcademicYear(id);

        return ResponseEntity.ok(
                toResponse(academicYear)
        );
    }


    @PutMapping("/id/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicYearResponse>
    deactivateAcademicYear(
            @PathVariable Long id
    ) {

        academicYearService.deactivateAcademicYear(id);

        return ResponseEntity.ok(
                toResponse(
                        academicYearService
                                .getAcademicYearById(id)
                )
        );
    }


    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAcademicYear(
            @PathVariable Long id
    ) {

        academicYearService.deleteAcademicYear(id);

        return ResponseEntity.noContent().build();
    }


    private AcademicYearResponse toResponse(
            AcademicYear academicYear
    ) {

        return AcademicYearResponse.builder()
                .id(academicYear.getId())
                .name(academicYear.getName())
                .startDate(academicYear.getStartDate())
                .endDate(academicYear.getEndDate())
                .active(academicYear.isActive())
                .createdAt(academicYear.getCreatedAt())
                .updatedAt(academicYear.getUpdatedAt())
                .build();
    }
}