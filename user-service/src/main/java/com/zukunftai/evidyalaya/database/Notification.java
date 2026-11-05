package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "notification")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "source_type", nullable = false, length = 20) private String sourceType;
    @Column(name = "source_id") private Long sourceId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, length = 1000) private String message;
    @Column(nullable = false, length = 30) private String category;
    @Column(nullable = false, length = 20) private String priority;
    @Column(name = "target_url", length = 500) private String targetUrl;
    @Column(name = "deduplication_key", length = 180, unique = true) private String deduplicationKey;
    @Column(name = "read_at") private LocalDateTime readAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
