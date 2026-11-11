package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailNotificationAttachmentSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EmailNotificationAttachmentSnapshotRepository
        extends JpaRepository<EmailNotificationAttachmentSnapshot, UUID> {
}
