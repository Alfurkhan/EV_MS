package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.model.SubjectRequest;
import com.zukunftai.evidyalaya.model.SubjectFacultyRequest;
import com.zukunftai.evidyalaya.model.SubjectResponse;
import com.zukunftai.evidyalaya.service.SubjectService;
import com.zukunftai.evidyalaya.model.FacultySummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/subject", produces = "application/json")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectResponse> createSubject(
            @Valid @RequestBody SubjectRequest request) {

        Subject subject = subjectService.createSubject(
                request.getName(),
                request.getCode(),
                request.getDescription()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(subject));
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {

        List<SubjectResponse> response =
                subjectService.getAllSubjects()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponse> getSubject(
            @PathVariable Long id) {

        Subject subject =
                subjectService.getSubjectById(id);

        return ResponseEntity.ok(
                toResponse(subject)
        );
    }

    @PostMapping("/{subjectId}/faculty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignFaculty(
            @PathVariable Long subjectId,
            @Valid @RequestBody SubjectFacultyRequest request) {

        subjectService.assignFacultyToSubject(
                subjectId,
                request.getFacultyId()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{subjectId}/grade/{gradeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignSubjectToGrade(
            @PathVariable Long subjectId,
            @PathVariable Long gradeId
    ) {
        subjectService.assignSubjectToGrade(subjectId, gradeId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{subjectId}/faculty/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeFaculty(
            @PathVariable Long subjectId,
            @PathVariable Long facultyId) {

        subjectService.removeFacultyFromSubject(
                subjectId,
                facultyId
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{subjectId}/grade/{gradeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeSubjectFromGrade(
            @PathVariable Long subjectId,
            @PathVariable Long gradeId
    ) {
        subjectService.removeSubjectFromGrade(subjectId, gradeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SubjectResponse>> getFacultySubjects(
            @PathVariable Long facultyId) {

        List<SubjectResponse> response =
                subjectService
                        .getSubjectsForFaculty(facultyId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequest request) {

        Subject subject =
                subjectService.updateSubject(
                        id,
                        request.getName(),
                        request.getCode(),
                        request.getDescription(),
                        request.getActive()
                );

        return ResponseEntity.ok(
                toResponse(subject)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id) {

        subjectService.deleteSubject(id);

        return ResponseEntity.noContent().build();
    }

    private SubjectResponse toResponse(
            Subject subject) {

        List<FacultySummaryResponse> assignedFaculties =
                subject.getFaculties()
                        .stream()
                        .map(faculty ->
                                FacultySummaryResponse.builder()
                                        .id(faculty.getId())
                                        .fullName(faculty.getFullName())
                                        .email(faculty.getEmail())
                                        .build()
                        )
                        .toList();

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .description(subject.getDescription())
                .active(subject.isActive())
                .assignedFaculties(assignedFaculties)
                .build();
    }

    @GetMapping("/grade/{gradeId}")
    public ResponseEntity<List<SubjectResponse>> getGradeSubjects(
            @PathVariable Long gradeId
    ) {

        List<SubjectResponse> response =
                subjectService
                        .getSubjectsForGrade(gradeId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<SubjectResponse>> getMySubjects() {

        List<SubjectResponse> response =
                subjectService
                        .getMySubjects()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }
}