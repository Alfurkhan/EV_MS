package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByAcademicYear(AcademicYear academicYear);

    List<Timetable> findByGrade(Grade grade);

    List<Timetable> findBySection(Section section);

    List<Timetable> findBySubject(Subject subject);

    List<Timetable> findByFaculty(User faculty);

    List<Timetable> findByDayOfWeek(DayOfWeek dayOfWeek);

    List<Timetable> findByAcademicYearAndGrade(
            AcademicYear academicYear,
            Grade grade
    );

    List<Timetable> findByAcademicYearAndGradeAndSection(
            AcademicYear academicYear,
            Grade grade,
            Section section
    );

    List<Timetable> findByAcademicYearAndGradeAndSectionAndActiveTrue(
            AcademicYear academicYear,
            Grade grade,
            Section section
    );

    /*
     * Active timetable entries that are valid on the supplied date.
     */
    List<Timetable>
    findByAcademicYearAndGradeAndSectionAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            AcademicYear academicYear,
            Grade grade,
            Section section,
            LocalDate date1,
            LocalDate date2
    );

    /*
     * Faculty timetable entries that are active and currently valid.
     */
    List<Timetable>
    findByFacultyAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User faculty,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Timetable> findByFacultyAndDayOfWeek(
            User faculty,
            DayOfWeek dayOfWeek
    );

    List<Timetable> findBySectionAndDayOfWeek(
            Section section,
            DayOfWeek dayOfWeek
    );

    List<Timetable> findBySubjectAndFaculty(
            Subject subject,
            User faculty
    );

    /*
     * Faculty overlap:
     *
     * Same faculty
     * + same day
     * + active
     * + overlapping time
     * + overlapping recurring date range
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.faculty = :faculty
          AND t.dayOfWeek = :dayOfWeek
          AND t.active = true
          AND t.startTime < :endTime
          AND t.endTime > :startTime
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsFacultyOverlap(
            @Param("faculty") User faculty,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /*
     * Same as above, but ignore the timetable currently being updated.
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.faculty = :faculty
          AND t.dayOfWeek = :dayOfWeek
          AND t.active = true
          AND t.id <> :id
          AND t.startTime < :endTime
          AND t.endTime > :startTime
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsFacultyOverlapForUpdate(
            @Param("faculty") User faculty,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("id") Long id
    );

    /*
     * Section overlap:
     *
     * Same section
     * + same day
     * + active
     * + overlapping time
     * + overlapping recurring date range
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.section = :section
          AND t.dayOfWeek = :dayOfWeek
          AND t.active = true
          AND t.startTime < :endTime
          AND t.endTime > :startTime
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsSectionOverlap(
            @Param("section") Section section,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /*
     * Section overlap for update.
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.section = :section
          AND t.dayOfWeek = :dayOfWeek
          AND t.active = true
          AND t.id <> :id
          AND t.startTime < :endTime
          AND t.endTime > :startTime
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsSectionOverlapForUpdate(
            @Param("section") Section section,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("id") Long id
    );

    /*
     * Prevent the same subject in the same Grade + Section + Academic Year
     * from being assigned to different faculty members during overlapping
     * recurring periods.
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.academicYear = :academicYear
          AND t.grade = :grade
          AND t.section = :section
          AND t.subject = :subject
          AND t.faculty <> :faculty
          AND t.active = true
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsSubjectWithDifferentFaculty(
            @Param("academicYear") AcademicYear academicYear,
            @Param("grade") Grade grade,
            @Param("section") Section section,
            @Param("subject") Subject subject,
            @Param("faculty") User faculty,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /*
     * Same protection for timetable updates.
     */
    @Query("""
        SELECT COUNT(t) > 0
        FROM Timetable t
        WHERE t.academicYear = :academicYear
          AND t.grade = :grade
          AND t.section = :section
          AND t.subject = :subject
          AND t.faculty <> :faculty
          AND t.active = true
          AND t.id <> :id
          AND t.startDate <= :endDate
          AND t.endDate >= :startDate
        """)
    boolean existsSubjectWithDifferentFacultyForUpdate(
            @Param("academicYear") AcademicYear academicYear,
            @Param("grade") Grade grade,
            @Param("section") Section section,
            @Param("subject") Subject subject,
            @Param("faculty") User faculty,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("id") Long id
    );

    /*
     * Used by the automatic expiry process.
     */
    List<Timetable> findByActiveTrueAndEndDateBefore(
            LocalDate date
    );
}