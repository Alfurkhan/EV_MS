package com.zukunftai.evidyalaya.model;
import java.time.*;
public record NotificationResponse(
    Long id, String sourceType, Long sourceId, String title, String message,
    String category, String priority, String targetUrl, boolean read,
    LocalDateTime readAt, Instant createdAt
) {}
