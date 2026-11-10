package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "email_notification_attempt",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_email_attempt_number",
                columnNames = {"outbox_id", "attempt_number"}
        ),
        indexes = @Index(name = "idx_email_attempt_outbox", columnList = "outbox_id,started_at")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "outbox_id", nullable = false)
    private EmailNotificationOutbox outbox;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EmailNotificationAttemptStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @PrePersist
    void onCreate() {
        if (startedAt == null) startedAt = Instant.now();
    }
}
