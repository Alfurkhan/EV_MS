package com.zukunftai.evidyalaya.model;
import com.zukunftai.evidyalaya.database.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
public record AnnouncementRequest(
    @NotBlank @Size(max=200) String title,
    @NotBlank @Size(max=10000) String message,
    @NotNull AnnouncementAudience audienceType,
    Long academicYearId,
    Long gradeId,
    Long sectionId,
    AnnouncementTargetScope targetScope,
    List<@NotNull Long> timetableAssignmentIds,
    @NotNull AnnouncementPriority priority,
    LocalDateTime scheduledAt,
    LocalDateTime expiresAt
) {}