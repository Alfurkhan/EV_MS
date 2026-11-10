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

@Service
public class EmailNotificationClaimService {
    private final EmailNotificationOutboxRepository outboxRepository;
    private final EmailNotificationAttemptRepository attemptRepository;

    public EmailNotificationClaimService(EmailNotificationOutboxRepository outboxRepository,
                                         EmailNotificationAttemptRepository attemptRepository) {
        this.outboxRepository = outboxRepository;
        this.attemptRepository = attemptRepository;
    }

    /** Claim and record attempts atomically; commit occurs before any HTTP call. */
    @Transactional
    public List<EmailNotificationOutbox> claimDue(int batchSize, Duration leaseDuration) {
        Instant now = Instant.now();
        Instant leaseUntil = now.plus(leaseDuration);
        outboxRepository.claimDue(now, leaseUntil, batchSize);
        List<EmailNotificationOutbox> claimed = outboxRepository.findByStatusAndLockedUntil(
                EmailNotificationOutboxStatus.PROCESSING, leaseUntil);
        for (EmailNotificationOutbox outbox : claimed) {
            attemptRepository.save(EmailNotificationAttempt.builder()
                    .outbox(outbox).attemptNumber(outbox.getAttempts())
                    .status(EmailNotificationAttemptStatus.STARTED).startedAt(now).build());
        }
        return claimed;
    }
}
