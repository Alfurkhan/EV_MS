package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.service.GradeService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class GradeServiceImpl implements GradeService {

    private final GradeRepository gradeRepository;
    private final AcademicYearRepository academicYearRepository;

    public GradeServiceImpl(
            GradeRepository gradeRepository,
            AcademicYearRepository academicYearRepository
    ) {
        this.gradeRepository = gradeRepository;
        this.academicYearRepository = academicYearRepository;
    }


    /*
     * ============================================================
     * CREATE GRADE
     * ============================================================
     */

    @Override
    public Grade createGrade(
            Long academicYearId,
            String name,
            String description
    ) {

        AcademicYear academicYear =
                getAcademicYearById(academicYearId);

        String normalizedName =
                normalizeName(name);

        if (gradeRepository.existsByAcademicYearAndName(
                academicYear,
                normalizedName
        )) {

            throw new APIException(
                    "A grade with this name already exists in the academic year.",
                    HttpStatus.CONFLICT,
                    "GRADE_ALREADY_EXISTS"
            );
        }

        Instant now = Instant.now();

        Grade grade =
                Grade.builder()
                        .academicYear(academicYear)
                        .name(normalizedName)
                        .description(
                                description == null
                                        ? null
                                        : description.trim()
                        )
                        .active(true)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();

        return gradeRepository.save(grade);
    }


    /*
     * ============================================================
     * GET ALL GRADES
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<Grade> getAllGrades() {

        return gradeRepository.findAll();
    }


    /*
     * ============================================================
     * GET GRADES BY ACADEMIC YEAR
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<Grade> getGradesByAcademicYear(
            Long academicYearId
    ) {

        AcademicYear academicYear =
                getAcademicYearById(academicYearId);

        return gradeRepository.findByAcademicYear(
                academicYear
        );
    }


    /*
     * ============================================================
     * GET GRADE BY ID
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public Grade getGradeById(Long id) {

        return gradeRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Grade not found.",
                                HttpStatus.NOT_FOUND,
                                "GRADE_NOT_FOUND"
                        )
                );
    }


    /*
     * ============================================================
     * UPDATE GRADE
     * ============================================================
     */

    @Override
    public Grade updateGrade(
            Long id,
            String name,
            String description,
            boolean active
    ) {

        Grade grade =
                getGradeById(id);

        String normalizedName =
                normalizeName(name);

        gradeRepository
                .findByAcademicYearAndName(
                        grade.getAcademicYear(),
                        normalizedName
                )
                .filter(existing ->
                        !existing.getId().equals(id)
                )
                .ifPresent(existing -> {

                    throw new APIException(
                            "A grade with this name already exists in the academic year.",
                            HttpStatus.CONFLICT,
                            "GRADE_ALREADY_EXISTS"
                    );

                });

        grade.setName(
                normalizedName
        );

        grade.setDescription(
                description == null
                        ? null
                        : description.trim()
        );

        grade.setActive(active);

        grade.setUpdatedAt(
                Instant.now()
        );

        return gradeRepository.save(
                grade
        );
    }


    /*
     * ============================================================
     * DELETE GRADE
     * ============================================================
     */

    @Override
    public void deleteGrade(Long id) {

        Grade grade =
                getGradeById(id);

        gradeRepository.delete(
                grade
        );
    }


    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    private AcademicYear getAcademicYearById(
            Long id
    ) {

        return academicYearRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Academic year not found.",
                                HttpStatus.NOT_FOUND,
                                "ACADEMIC_YEAR_NOT_FOUND"
                        )
                );
    }


    private String normalizeName(
            String name
    ) {

        if (name == null ||
                name.isBlank()) {

            throw new APIException(
                    "Grade name is required.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_NAME_REQUIRED"
            );
        }

        return name.trim();
    }
}