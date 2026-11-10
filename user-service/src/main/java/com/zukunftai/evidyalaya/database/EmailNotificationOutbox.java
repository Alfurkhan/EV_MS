package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(
        name = "email_notification_outbox",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_email_outbox_notification", columnNames = "notification_id"),
                @UniqueConstraint(name = "uk_email_outbox_deduplication", columnNames = "deduplication_key")
        },
        indexes = {
                @Index(name = "idx_email_outbox_due", columnList = "status,next_attempt_at,created_at"),
                @Index(name = "idx_email_outbox_lease", columnList = "status,locked_until"),
                @Index(name = "idx_email_outbox_recipient", columnList = "recipient_user_id,created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * Snapshot reference only. Deliberately not a foreign key: deleting an
     * in-app notification must not erase an already queued email or its audit trail.
     */
    @Column(name = "notification_id", nullable = false)
    private Long notificationId;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    @Column(name = "template_type", nullable = false, length = 40)
    private String templateType;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "deduplication_key", nullable = false, length = 220)
    private String deduplicationKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EmailNotificationOutboxStatus status = EmailNotificationOutboxStatus.PENDING;

    @Column(name = "attempts", nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_error", length = 2000)
    private String lastError;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (nextAttemptAt == null) nextAttemptAt = now;
    }
}
