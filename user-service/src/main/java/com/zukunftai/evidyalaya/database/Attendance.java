package com.zukunftai.evidyalaya.database;

import com.zukunftai.evidyalaya.model.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "attendance",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_attendance_session_student",
                        columnNames = {
                                "class_session_id",
                                "student_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_attendance_session",
                        columnList = "class_session_id"
                ),
                @Index(
                        name = "idx_attendance_student",
                        columnList = "student_id"
                ),
                @Index(
                        name = "idx_attendance_status",
                        columnList = "status"
                )
        }
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * The actual class session for which attendance is being recorded.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "class_session_id",
            nullable = false
    )
    private ClassSession classSession;

    /**
     * The student whose attendance is being recorded.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            nullable = false,
            length = 20
    )
    private AttendanceStatus status;

    @Column(
            name = "remarks",
            length = 500
    )
    private String remarks;

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