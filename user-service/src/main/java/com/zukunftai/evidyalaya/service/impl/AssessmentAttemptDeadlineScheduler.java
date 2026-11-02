package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AssessmentAttempt;
import com.zukunftai.evidyalaya.database.AssessmentAttemptStatus;
import com.zukunftai.evidyalaya.repository.AssessmentAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AssessmentAttemptDeadlineScheduler {
    private final AssessmentAttemptRepository attemptRepository;

    // Server-side safety net: expire attempts even when the student makes no further API request.
    @Scheduled(fixedDelayString = "${app.assessment-auto-submit-interval-ms:15000}")
    @Transactional
    public void autoSubmitExpiredAttempts() {
        List<AssessmentAttempt> expired = attemptRepository.findByStatusAndDeadlineAtLessThanEqual(
                AssessmentAttemptStatus.IN_PROGRESS, Instant.now());
        Instant submittedAt = Instant.now();
        for (AssessmentAttempt attempt : expired) {
            if (attempt.getStatus() == AssessmentAttemptStatus.IN_PROGRESS
                    && !attempt.getDeadlineAt().isAfter(submittedAt)) {
                attempt.setStatus(AssessmentAttemptStatus.AUTO_SUBMITTED);
                attempt.setSubmittedAt(submittedAt);
                attempt.setUpdatedAt(submittedAt);
            }
        }
        // Managed entities are flushed by the surrounding transaction.
    }
}
