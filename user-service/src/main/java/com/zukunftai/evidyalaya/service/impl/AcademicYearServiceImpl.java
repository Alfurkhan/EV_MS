package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.service.AcademicYearService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class AcademicYearServiceImpl
        implements AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    public AcademicYearServiceImpl(
            AcademicYearRepository academicYearRepository
    ) {
        this.academicYearRepository =
                academicYearRepository;
    }


    @Override
    public AcademicYear createAcademicYear(
            String name,
            LocalDate startDate,
            LocalDate endDate
    ) {

        String normalizedName =
                normalizeName(name);

        validateAcademicYear(
                normalizedName,
                startDate,
                endDate
        );

        if (academicYearRepository.existsByName(
                normalizedName
        )) {

            throw new APIException(
                    "An academic year with this name already exists.",
                    HttpStatus.CONFLICT,
                    "ACADEMIC_YEAR_ALREADY_EXISTS"
            );
        }

        Instant now = Instant.now();

        AcademicYear academicYear =
                AcademicYear.builder()
                        .name(normalizedName)
                        .startDate(startDate)
                        .endDate(endDate)
                        .active(false)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();

        return academicYearRepository.save(
                academicYear
        );
    }


    @Override
    @Transactional(readOnly = true)
    public List<AcademicYear> getAllAcademicYears() {

        return academicYearRepository.findAll();
    }


    @Override
    @Transactional(readOnly = true)
    public AcademicYear getAcademicYearById(
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


    @Override
    @Transactional(readOnly = true)
    public AcademicYear getActiveAcademicYear() {

        return academicYearRepository.findByActiveTrue()
                .orElseThrow(() ->
                        new APIException(
                                "No active academic year is configured.",
                                HttpStatus.NOT_FOUND,
                                "ACTIVE_ACADEMIC_YEAR_NOT_FOUND"
                        )
                );
    }


    @Override
    public AcademicYear updateAcademicYear(
            Long id,
            String name,
            LocalDate startDate,
            LocalDate endDate
    ) {

        AcademicYear academicYear =
                getAcademicYearById(id);

        String normalizedName =
                normalizeName(name);

        validateAcademicYear(
                normalizedName,
                startDate,
                endDate
        );

        academicYearRepository.findByName(
                        normalizedName
                )
                .filter(existing ->
                        !existing.getId().equals(id)
                )
                .ifPresent(existing -> {

                    throw new APIException(
                            "An academic year with this name already exists.",
                            HttpStatus.CONFLICT,
                            "ACADEMIC_YEAR_ALREADY_EXISTS"
                    );

                });


        /*
         * Prevent changing an active academic year
         * into a date range that is invalid.
         *
         * Date validation has already been performed
         * above.
         */

        academicYear.setName(
                normalizedName
        );

        academicYear.setStartDate(
                startDate
        );

        academicYear.setEndDate(
                endDate
        );

        academicYear.setUpdatedAt(
                Instant.now()
        );

        return academicYearRepository.save(
                academicYear
        );
    }


    @Override
    public AcademicYear activateAcademicYear(
            Long id
    ) {

        AcademicYear academicYear =
                getAcademicYearById(id);


        /*
         * If another academic year is currently
         * active, deactivate it first.
         */

        academicYearRepository.findByActiveTrue()
                .ifPresent(currentActive -> {

                    if (!currentActive
                            .getId()
                            .equals(id)) {

                        currentActive.setActive(false);

                        currentActive.setUpdatedAt(
                                Instant.now()
                        );

                        academicYearRepository.save(
                                currentActive
                        );
                    }

                });


        academicYear.setActive(true);

        academicYear.setUpdatedAt(
                Instant.now()
        );

        return academicYearRepository.save(
                academicYear
        );
    }


    @Override
    public void deactivateAcademicYear(
            Long id
    ) {

        AcademicYear academicYear =
                getAcademicYearById(id);

        academicYear.setActive(false);

        academicYear.setUpdatedAt(
                Instant.now()
        );

        academicYearRepository.save(
                academicYear
        );
    }


    @Override
    public void deleteAcademicYear(
            Long id
    ) {

        AcademicYear academicYear =
                getAcademicYearById(id);

        academicYearRepository.delete(
                academicYear
        );
    }


    private String normalizeName(
            String name
    ) {

        if (name == null ||
                name.isBlank()) {

            throw new APIException(
                    "Academic year name is required.",
                    HttpStatus.BAD_REQUEST,
                    "ACADEMIC_YEAR_NAME_REQUIRED"
            );
        }

        return name.trim();
    }


    private void validateAcademicYear(
            String name,
            LocalDate startDate,
            LocalDate endDate
    ) {

        /*
         * ============================================================
         * BASIC DATE VALIDATION
         * ============================================================
         */

        if (startDate == null ||
                endDate == null) {

            throw new APIException(
                    "Start date and end date are required.",
                    HttpStatus.BAD_REQUEST,
                    "ACADEMIC_YEAR_DATES_REQUIRED"
            );
        }


        if (!endDate.isAfter(startDate)) {

            throw new APIException(
                    "End date must be after start date.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACADEMIC_YEAR_DATES"
            );
        }


        /*
         * ============================================================
         * ACADEMIC YEAR NAME FORMAT
         * ============================================================
         *
         * Expected format:
         *
         * 2029-2030
         */

        if (!name.matches("\\d{4}-\\d{4}")) {

            throw new APIException(
                    "Academic year must be in YYYY-YYYY format.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACADEMIC_YEAR_NAME_FORMAT"
            );
        }


        /*
         * ============================================================
         * EXTRACT YEARS FROM NAME
         * ============================================================
         */

        int startYear =
                Integer.parseInt(
                        name.substring(0, 4)
                );

        int endYear =
                Integer.parseInt(
                        name.substring(5, 9)
                );


        /*
         * ============================================================
         * YEARS MUST BE CONSECUTIVE
         * ============================================================
         *
         * Example:
         *
         * 2029-2030 ✅
         * 2029-2031 ❌
         */

        if (endYear != startYear + 1) {

            throw new APIException(
                    "Academic year must span two consecutive years.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACADEMIC_YEAR_RANGE"
            );
        }


        /*
         * ============================================================
         * START DATE YEAR MUST MATCH FIRST YEAR
         * ============================================================
         */

        if (startDate.getYear() != startYear) {

            throw new APIException(
                    "The Start date year doesn't match the academic year range.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACADEMIC_YEAR_START_DATE"
            );
        }


        /*
         * ============================================================
         * END DATE YEAR MUST MATCH SECOND YEAR
         * ============================================================
         */

        if (endDate.getYear() != endYear) {

            throw new APIException(
                    "The End date year doesn't match the academic year range.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACADEMIC_YEAR_END_DATE"
            );
        }
    }
}