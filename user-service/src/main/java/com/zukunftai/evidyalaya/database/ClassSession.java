package com.zukunftai.evidyalaya.database;

import com.zukunftai.evidyalaya.model.ClassSessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "class_session",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_class_session_timetable_date",
                        columnNames = {"timetable_id", "session_date"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_class_session_timetable",
                        columnList = "timetable_id"
                ),
                @Index(
                        name = "idx_class_session_date",
                        columnList = "session_date"
                ),
                @Index(
                        name = "idx_class_session_status",
                        columnList = "status"
                )
        }
)
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "timetable_id",
            nullable = false
    )
    private Timetable timetable;

    @Column(
            name = "session_date",
            nullable = false
    )
    private LocalDate sessionDate;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            nullable = false,
            length = 20
    )
    private ClassSessionStatus status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(
            name = "created_at",
            nullable = false
    )
    private Instant createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private Instant updatedAt;
}