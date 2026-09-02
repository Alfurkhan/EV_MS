package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.SectionRepository;
import com.zukunftai.evidyalaya.service.SectionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class SectionServiceImpl implements SectionService {

    private final SectionRepository sectionRepository;

    private final GradeRepository gradeRepository;

    public SectionServiceImpl(
            SectionRepository sectionRepository,
            GradeRepository gradeRepository
    ) {
        this.sectionRepository = sectionRepository;
        this.gradeRepository = gradeRepository;
    }


    /*
     * ============================================================
     * CREATE SECTION
     * ============================================================
     */

    @Override
    public Section createSection(
            Long gradeId,
            String name,
            String description
    ) {

        Grade grade =
                getGradeById(gradeId);

        String normalizedName =
                normalizeName(name);

        if (sectionRepository.existsByGradeAndName(
                grade,
                normalizedName
        )) {

            throw new APIException(
                    "A section with this name already exists in the grade.",
                    HttpStatus.CONFLICT,
                    "SECTION_ALREADY_EXISTS"
            );
        }

        Instant now = Instant.now();

        Section section =
                Section.builder()
                        .grade(grade)
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

        return sectionRepository.save(
                section
        );
    }


    /*
     * ============================================================
     * GET ALL SECTIONS
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<Section> getAllSections() {

        return sectionRepository.findAll();
    }


    /*
     * ============================================================
     * GET SECTIONS BY GRADE
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<Section> getSectionsByGrade(
            Long gradeId
    ) {

        Grade grade =
                getGradeById(gradeId);

        return sectionRepository.findByGrade(
                grade
        );
    }


    /*
     * ============================================================
     * GET SECTION BY ID
     * ============================================================
     */

    @Override
    @Transactional(readOnly = true)
    public Section getSectionById(
            Long id
    ) {

        return sectionRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Section not found.",
                                HttpStatus.NOT_FOUND,
                                "SECTION_NOT_FOUND"
                        )
                );
    }


    /*
     * ============================================================
     * UPDATE SECTION
     * ============================================================
     */

    @Override
    public Section updateSection(
            Long id,
            String name,
            String description,
            boolean active
    ) {

        Section section =
                getSectionById(id);

        String normalizedName =
                normalizeName(name);

        sectionRepository
                .findByGradeAndName(
                        section.getGrade(),
                        normalizedName
                )
                .filter(existing ->
                        !existing.getId().equals(id)
                )
                .ifPresent(existing -> {

                    throw new APIException(
                            "A section with this name already exists in the grade.",
                            HttpStatus.CONFLICT,
                            "SECTION_ALREADY_EXISTS"
                    );

                });

        section.setName(
                normalizedName
        );

        section.setDescription(
                description == null
                        ? null
                        : description.trim()
        );

        section.setActive(active);

        section.setUpdatedAt(
                Instant.now()
        );

        return sectionRepository.save(
                section
        );
    }


    /*
     * ============================================================
     * DELETE SECTION
     * ============================================================
     */

    @Override
    public void deleteSection(
            Long id
    ) {

        Section section =
                getSectionById(id);

        sectionRepository.delete(
                section
        );
    }


    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    private Grade getGradeById(
            Long id
    ) {

        return gradeRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Grade not found.",
                                HttpStatus.NOT_FOUND,
                                "GRADE_NOT_FOUND"
                        )
                );
    }


    private String normalizeName(
            String name
    ) {

        if (name == null ||
                name.isBlank()) {

            throw new APIException(
                    "Section name is required.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_NAME_REQUIRED"
            );
        }

        return name.trim();
    }
}