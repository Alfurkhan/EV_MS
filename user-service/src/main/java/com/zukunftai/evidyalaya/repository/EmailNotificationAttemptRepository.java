package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailNotificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmailNotificationAttemptRepository extends JpaRepository<EmailNotificationAttempt, UUID> {

    List<EmailNotificationAttempt> findByOutboxIdOrderByAttemptNumberAsc(UUID outboxId);
}
