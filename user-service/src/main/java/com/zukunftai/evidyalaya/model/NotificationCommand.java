package com.zukunftai.evidyalaya.model;

/**
 * Internal command used by feature services to create activity notifications.
 *
 * deduplicationKeyPrefix is optional. When supplied, the notification service
 * appends the recipient user ID to create one stable key per recipient.
 *
 * emailEligible is an explicit producer opt-in. It prevents workflow-only
 * notifications (for example, timetable approval requests) from becoming emails.
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
        boolean emailEligible
) {
    /**
     * Backward-compatible constructor. Existing notification producers remain
     * in-app-only until they explicitly opt in to email delivery.
     */
    public NotificationCommand(
            String sourceType,
            Long sourceId,
            String title,
            String message,
            String category,
            String priority,
            String targetUrl,
            String deduplicationKeyPrefix
    ) {
        this(sourceType, sourceId, title, message, category, priority,
                targetUrl, deduplicationKeyPrefix, false);
    }
}
