package com.zukunftai.evidyalaya.service.email;

import com.zukunftai.evidyalaya.repository.EmailNotificationAttachmentSnapshotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Component
public class EmailAttachmentSnapshotCleanupService {
    private final EmailNotificationAttachmentSnapshotRepository repository;
    private final Duration retention;

    public EmailAttachmentSnapshotCleanupService(
            EmailNotificationAttachmentSnapshotRepository repository,
            @Value("${email.notifications.attachments.retention-days:30}") long retentionDays) {
        this.repository = repository;
        this.retention = Duration.ofDays(Math.max(30, retentionDays));
    }

    @Scheduled(cron = "${email.notifications.attachments.cleanup-cron:0 30 3 * * *}")
    @Transactional
    public void removeExpiredSnapshots() {
        repository.deleteExpiredUnreferenced(Instant.now().minus(retention));
    }
}
