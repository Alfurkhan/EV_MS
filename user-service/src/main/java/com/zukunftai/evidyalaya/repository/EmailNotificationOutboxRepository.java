package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import com.zukunftai.evidyalaya.database.EmailNotificationOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailNotificationOutboxRepository extends JpaRepository<EmailNotificationOutbox, UUID> {

    Optional<EmailNotificationOutbox> findByDeduplicationKey(String deduplicationKey);

    List<EmailNotificationOutbox> findTop100ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            EmailNotificationOutboxStatus status,
            Instant dueAt
    );
}
