package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.EmailNotificationAttachmentSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface EmailNotificationAttachmentSnapshotRepository
        extends JpaRepository<EmailNotificationAttachmentSnapshot, UUID> {

    @Modifying
    @Query(value = """
            DELETE FROM email_notification_attachment_snapshot snapshot
             WHERE snapshot.created_at < :cutoff
               AND NOT EXISTS (
                   SELECT 1
                     FROM email_notification_outbox outbox
                    WHERE outbox.status IN ('PENDING', 'PROCESSING')
                      AND jsonb_exists(outbox.payload -> 'attachmentSnapshotIds', snapshot.id::text)
               )
            """, nativeQuery = true)
    int deleteExpiredUnreferenced(@Param("cutoff") Instant cutoff);
}
