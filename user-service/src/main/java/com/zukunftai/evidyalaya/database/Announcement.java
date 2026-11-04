package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "announcement")
public class Announcement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String message;
    @Enumerated(EnumType.STRING) @Column(name = "audience_type", nullable = false, length = 20)
    private AnnouncementAudience audienceType;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "academic_year_id") private AcademicYear academicYear;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "grade_id") private Grade grade;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "section_id") private Section section;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default
    private AnnouncementPriority priority = AnnouncementPriority.NORMAL;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default
    private AnnouncementStatus status = AnnouncementStatus.DRAFT;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by", nullable = false) private User createdBy;
    @Column(name = "scheduled_at") private LocalDateTime scheduledAt;
    @Column(name = "expires_at") private LocalDateTime expiresAt;
    @Column(name = "published_at") private LocalDateTime publishedAt;
    @Column(name = "archived_at") private LocalDateTime archivedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
