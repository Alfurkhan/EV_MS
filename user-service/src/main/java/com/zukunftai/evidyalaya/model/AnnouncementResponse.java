package com.zukunftai.evidyalaya.model;
import com.zukunftai.evidyalaya.database.*;
import java.time.*;
public record AnnouncementResponse(
    Long id, String title, String message, AnnouncementAudience audienceType,
    Long academicYearId, Long gradeId, Long sectionId, AnnouncementPriority priority,
    AnnouncementStatus status, String authorName, LocalDateTime scheduledAt,
    LocalDateTime expiresAt, LocalDateTime publishedAt, long readCount,
    long unreadCount, LocalDateTime readAt, boolean canManage, Instant createdAt, Instant updatedAt
) {}
