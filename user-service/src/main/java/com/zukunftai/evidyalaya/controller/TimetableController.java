package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.model.TimetableRequest;
import com.zukunftai.evidyalaya.model.TimetableResponse;
import com.zukunftai.evidyalaya.service.TimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        path = "/timetable",
        produces = "application/json"
)
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;


    /*
     * ============================================================
     * CREATE TIMETABLE
     * ============================================================
     */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TimetableResponse> createTimetable(
            @Valid @RequestBody TimetableRequest request
    ) {

        Timetable timetable =
                timetableService.createTimetable(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(timetable));
    }


    /*
     * ============================================================
     * GET ALL TIMETABLES
     * ============================================================
     */

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimetableResponse>> getAllTimetables() {

        List<TimetableResponse> response =
                timetableService
                        .getAllTimetables()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET TIMETABLE BY ID
     * ============================================================
     */

    @GetMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TimetableResponse> getTimetable(
            @PathVariable Long id
    ) {

        Timetable timetable =
                timetableService.getTimetableById(id);

        return ResponseEntity.ok(
                toResponse(timetable)
        );
    }


    /*
     * ============================================================
     * UPDATE TIMETABLE
     * ============================================================
     */

    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TimetableResponse> updateTimetable(
            @PathVariable Long id,
            @Valid @RequestBody TimetableRequest request
    ) {

        Timetable timetable =
                timetableService.updateTimetable(
                        id,
                        request
                );

        return ResponseEntity.ok(
                toResponse(timetable)
        );
    }


    /*
     * ============================================================
     * GET TIMETABLES BY ACADEMIC YEAR
     * ============================================================
     */

    @GetMapping("/academic-year/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimetableResponse>>
    getTimetablesByAcademicYear(
            @PathVariable Long academicYearId
    ) {

        List<TimetableResponse> response =
                timetableService
                        .getTimetablesByAcademicYear(
                                academicYearId
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET TIMETABLES BY GRADE
     * ============================================================
     */

    @GetMapping("/grade/{gradeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimetableResponse>>
    getTimetablesByGrade(
            @PathVariable Long gradeId
    ) {

        List<TimetableResponse> response =
                timetableService
                        .getTimetablesByGrade(gradeId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET TIMETABLES BY SECTION
     * ============================================================
     */

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimetableResponse>>
    getTimetablesBySection(
            @PathVariable Long sectionId
    ) {

        List<TimetableResponse> response =
                timetableService
                        .getTimetablesBySection(sectionId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET TIMETABLES BY FACULTY
     * ============================================================
     */

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimetableResponse>>
    getTimetablesByFaculty(
            @PathVariable Long facultyId
    ) {

        List<TimetableResponse> response =
                timetableService
                        .getTimetablesByFaculty(facultyId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET MY TIMETABLE
     * ============================================================
     *
     * This endpoint is for the currently authenticated Faculty.
     */

    @GetMapping("/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<TimetableResponse>> getMyTimetable() {

        List<TimetableResponse> response =
                timetableService
                        .getMyTimetable()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * GET MY TIMETABLE - STUDENT
     * ============================================================
     *
     * The student's Grade and Section are obtained from the
     * authenticated student's active enrollment.
     *
     * The client does NOT provide a student ID, grade ID,
     * or section ID.
     *
     */

    @GetMapping("/my/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<TimetableResponse>>
    getMyStudentTimetable() {

        List<TimetableResponse> response =
                timetableService
                        .getMyStudentTimetable()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(response);
    }


    /*
     * ============================================================
     * DELETE TIMETABLE
     * ============================================================
     */

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTimetable(
            @PathVariable Long id
    ) {

        timetableService.deleteTimetable(id);

        return ResponseEntity
                .noContent()
                .build();
    }


    /*
     * ============================================================
     * DISABLE/ENABLE TIMETABLE
     * ============================================================
     */

    @PutMapping("/id/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableTimetable(
            @PathVariable Long id
    ) {
        timetableService.disableTimetable(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/id/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> enableTimetable(
            @PathVariable Long id
    ) {
        timetableService.enableTimetable(id);
        return ResponseEntity.noContent().build();
    }


    /*
     * ============================================================
     * RESPONSE MAPPING
     * ============================================================
     */

    private TimetableResponse toResponse(
            Timetable timetable
    ) {

        return TimetableResponse.builder()

                .id(
                        timetable.getId()
                )

                .academicYearId(
                        timetable.getAcademicYear().getId()
                )

                .academicYearName(
                        timetable.getAcademicYear().getName()
                )

                .gradeId(
                        timetable.getGrade().getId()
                )

                .gradeName(
                        timetable.getGrade().getName()
                )

                .sectionId(
                        timetable.getSection().getId()
                )

                .sectionName(
                        timetable.getSection().getName()
                )

                .subjectId(
                        timetable.getSubject().getId()
                )

                .subjectName(
                        timetable.getSubject().getName()
                )

                .subjectCode(
                        timetable.getSubject().getCode()
                )

                .facultyId(
                        timetable.getFaculty().getId()
                )

                .facultyName(
                        timetable.getFaculty().getFullName()
                )

                .facultyEmail(
                        timetable.getFaculty().getEmail()
                )

                .dayOfWeek(
                        timetable.getDayOfWeek()
                )

                .startTime(
                        timetable.getStartTime()
                )

                .endTime(
                        timetable.getEndTime()
                )

                .classType(
                        timetable.getClassType()
                )

                .meetingPlatform(
                        timetable.getMeetingPlatform()
                )

                .startDate(
                        timetable.getStartDate()
                )

                .endDate(
                        timetable.getEndDate()
                )

                .room(
                        timetable.getRoom()
                )

                .meetingLink(
                        timetable.getMeetingLink()
                )

                .notes(
                        timetable.getNotes()
                )

                .active(
                        timetable.isActive()
                )

                .createdAt(
                        timetable.getCreatedAt()
                )

                .updatedAt(
                        timetable.getUpdatedAt()
                )

                .build();
    }
}
