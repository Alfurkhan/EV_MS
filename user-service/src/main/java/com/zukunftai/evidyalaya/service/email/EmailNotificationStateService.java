package com.zukunftai.evidyalaya.service.email;

import com.zukunftai.evidyalaya.database.EmailNotificationAttempt;
import com.zukunftai.evidyalaya.database.EmailNotificationAttemptStatus;
import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import com.zukunftai.evidyalaya.database.EmailNotificationOutboxStatus;
import com.zukunftai.evidyalaya.repository.EmailNotificationAttemptRepository;
import com.zukunftai.evidyalaya.repository.EmailNotificationOutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class EmailNotificationStateService {
    private static final List<Duration> RETRY_DELAYS = List.of(
            Duration.ofMinutes(1), Duration.ofMinutes(5),
            Duration.ofMinutes(15), Duration.ofHours(1));

    private final EmailNotificationOutboxRepository outboxRepository;
    private final EmailNotificationAttemptRepository attemptRepository;

    public EmailNotificationStateService(EmailNotificationOutboxRepository outboxRepository,
                                         EmailNotificationAttemptRepository attemptRepository) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional
    public void markSent(UUID outboxId, int attemptNumber) {
        EmailNotificationOutbox outbox = outboxRepository.findById(outboxId).orElseThrow();
        EmailNotificationAttempt attempt = findAttempt(outboxId, attemptNumber);
        Instant now = Instant.now();
        attempt.setStatus(EmailNotificationAttemptStatus.SENT);
        attempt.setCompletedAt(now);
        attempt.setErrorMessage(null);
        outbox.setStatus(EmailNotificationOutboxStatus.SENT);
        outbox.setSentAt(now);
        outbox.setLockedUntil(null);
        outbox.setLastError(null);
    }

    @Transactional
    public void markFailure(UUID outboxId, int attemptNumber, boolean retryable, int maxAttempts,
                            String errorMessage) {
        EmailNotificationOutbox outbox = outboxRepository.findById(outboxId).orElseThrow();
        EmailNotificationAttempt attempt = findAttempt(outboxId, attemptNumber);
        Instant now = Instant.now();
        String safeError = errorMessage == null ? "Email delivery failed." : errorMessage;
        if (safeError.length() > 2000) safeError = safeError.substring(0, 2000);
        attempt.setStatus(retryable
                ? EmailNotificationAttemptStatus.RETRYABLE_FAILURE
                : EmailNotificationAttemptStatus.PERMANENT_FAILURE);
        attempt.setCompletedAt(now);
        attempt.setErrorMessage(safeError);
        outbox.setLastError(safeError);
        outbox.setLockedUntil(null);

        if (!retryable || attemptNumber >= maxAttempts) {
            outbox.setStatus(EmailNotificationOutboxStatus.FAILED);
        } else {
            outbox.setStatus(EmailNotificationOutboxStatus.PENDING);
            outbox.setNextAttemptAt(now.plus(RETRY_DELAYS.get(
                    Math.min(attemptNumber - 1, RETRY_DELAYS.size() - 1))));
        }
    }

    private EmailNotificationAttempt findAttempt(UUID outboxId, int attemptNumber) {
        return attemptRepository.findByOutbox_IdOrderByAttemptNumberAsc(outboxId).stream()
                .filter(item -> item.getAttemptNumber() == attemptNumber)
                .findFirst().orElseThrow(() -> new IllegalStateException("Email attempt record not found."));
    }
}
