package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.repository.TimetableRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Component
public class TimetableExpiryScheduler {

    private final TimetableRepository timetableRepository;

    public TimetableExpiryScheduler(
            TimetableRepository timetableRepository
    ) {
        this.timetableRepository = timetableRepository;
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireTimetables() {

        LocalDate today = LocalDate.now();

        List<Timetable> expired =
                timetableRepository
                        .findByActiveTrueAndEndDateBefore(today);

        if (expired.isEmpty()) {
            return;
        }

        Instant now = Instant.now();

        for (Timetable timetable : expired) {
            timetable.setActive(false);
            timetable.setUpdatedAt(now);
        }

        timetableRepository.saveAll(expired);
    }
}