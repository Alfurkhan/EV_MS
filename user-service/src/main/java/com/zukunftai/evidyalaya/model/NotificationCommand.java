package com.zukunftai.evidyalaya.model;

/**
 * Internal command used by feature services to create activity notifications.
 *
 * deduplicationKeyPrefix is optional. When supplied, the notification service
 * appends the recipient user ID to create one stable key per recipient.
 */
public record NotificationCommand(
        String sourceType,
        Long sourceId,
        String title,
        String message,
        String category,
        String priority,
        String targetUrl,
        String deduplicationKeyPrefix
) {
}
