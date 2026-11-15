package com.zukunftai.evidyalaya.model;

import java.util.List;
import java.util.Map;

/**
 * Internal command used by feature services to create activity notifications.
 * Email attachment sources are copied into immutable snapshots before the
 * notification/outbox transaction commits.
 */
public record NotificationCommand(
        String sourceType,
        Long sourceId,
        String title,
        String message,
        String category,
        String priority,
        String targetUrl,
        String deduplicationKeyPrefix,
        boolean emailEligible,
        Map<Long, Map<String, Object>> recipientEmailData,
        List<EmailAttachmentSource> attachmentSources
) {
    public NotificationCommand(
            String sourceType, Long sourceId, String title, String message,
            String category, String priority, String targetUrl,
            String deduplicationKeyPrefix, boolean emailEligible,
            Map<Long, Map<String, Object>> recipientEmailData
    ) {
        this(sourceType, sourceId, title, message, category, priority,
                targetUrl, deduplicationKeyPrefix, emailEligible, recipientEmailData, List.of());
    }

    public NotificationCommand(
            String sourceType, Long sourceId, String title, String message,
            String category, String priority, String targetUrl,
            String deduplicationKeyPrefix, boolean emailEligible
    ) {
        this(sourceType, sourceId, title, message, category, priority,
                targetUrl, deduplicationKeyPrefix, emailEligible, Map.of(), List.of());
    }

    public NotificationCommand(
            String sourceType, Long sourceId, String title, String message,
            String category, String priority, String targetUrl,
            String deduplicationKeyPrefix
    ) {
        this(sourceType, sourceId, title, message, category, priority,
                targetUrl, deduplicationKeyPrefix, false, Map.of(), List.of());
    }
}
