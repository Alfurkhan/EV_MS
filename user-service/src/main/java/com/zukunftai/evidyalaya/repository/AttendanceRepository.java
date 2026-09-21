package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Attendance;
import com.zukunftai.evidyalaya.database.ClassSession;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByClassSessionAndStudent(
            ClassSession classSession,
            User student
    );

    List<Attendance> findByClassSession(
            ClassSession classSession
    );

    List<Attendance> findByClassSessionOrderByStudentFullNameAsc(
            ClassSession classSession
    );

    List<Attendance> findByStudent(
            User student
    );

    List<Attendance> findByStudentAndStatus(
            User student,
            AttendanceStatus status
    );

    boolean existsByClassSessionAndStudent(
            ClassSession classSession,
            User student
    );

    /*
     * =====================================================
     * DASHBOARD ATTENDANCE QUERIES
     * =====================================================
     */

    List<Attendance> findByStudentIdAndClassSessionSessionDateBetween(
            Long studentId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Attendance>
    findByClassSessionTimetableFacultyIdAndClassSessionSessionDateBetween(
            Long facultyId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Attendance> findByClassSessionSessionDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );
}