package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import com.zukunftai.evidyalaya.database.EmailNotificationOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailNotificationOutboxRepository extends JpaRepository<EmailNotificationOutbox, UUID> {

    Optional<EmailNotificationOutbox> findByDeduplicationKey(String deduplicationKey);

    List<EmailNotificationOutbox> findByStatusAndLockedUntil(
            EmailNotificationOutboxStatus status, Instant lockedUntil);

    @Modifying
    @Query(value = """
            WITH due AS (
                SELECT id
                FROM email_notification_outbox
                WHERE (status = 'PENDING' AND next_attempt_at <= :now)
                   OR (status = 'PROCESSING' AND locked_until <= :now)
                ORDER BY created_at ASC
                LIMIT :batchSize
                FOR UPDATE SKIP LOCKED
            )
            UPDATE email_notification_outbox AS outbox
               SET status = 'PROCESSING',
                   locked_until = :leaseUntil,
                   attempts = outbox.attempts + 1
              FROM due
             WHERE outbox.id = due.id
            """, nativeQuery = true)
    int claimDue(
            @Param("now") Instant now,
            @Param("leaseUntil") Instant leaseUntil,
            @Param("batchSize") int batchSize);
}
