package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "announcement_recipient", uniqueConstraints = @UniqueConstraint(name = "uk_announcement_recipient", columnNames = {"announcement_id","user_id"}))
public class AnnouncementRecipient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "announcement_id", nullable = false) private Announcement announcement;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "read_at") private LocalDateTime readAt;
    @Column(name = "delivered_at", nullable = false) private LocalDateTime deliveredAt;
}
