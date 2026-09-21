package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.ClassSession;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.model.ClassSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ClassSessionRepository
        extends JpaRepository<ClassSession, Long> {

    Optional<ClassSession> findByTimetableAndSessionDate(
            Timetable timetable,
            LocalDate sessionDate
    );

    List<ClassSession> findByTimetableOrderBySessionDateDesc(
            Timetable timetable
    );

    List<ClassSession> findBySessionDateOrderByStartedAtAsc(
            LocalDate sessionDate
    );

    List<ClassSession> findByStatus(
            ClassSessionStatus status
    );

    List<ClassSession> findByTimetableAndStatus(
            Timetable timetable,
            ClassSessionStatus status
    );

    boolean existsByTimetableAndSessionDate(
            Timetable timetable,
            LocalDate sessionDate
    );
}