package com.zukunftai.evidyalaya.model;
import com.zukunftai.evidyalaya.database.*;
import java.time.*;
import java.util.List;
public record AnnouncementResponse(
    Long id, String title, String message, AnnouncementAudience audienceType,
    Long academicYearId, Long gradeId, Long sectionId, AnnouncementTargetScope targetScope,
    String subjectName, List<Long> timetableAssignmentIds, List<String> targetClassLabels,
    AnnouncementPriority priority, AnnouncementStatus status, String authorName, LocalDateTime scheduledAt,
    LocalDateTime expiresAt, LocalDateTime publishedAt, long readCount,
    long unreadCount, LocalDateTime readAt, boolean canManage, Instant createdAt, Instant updatedAt
) {}