package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "student_enrollment",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_student_enrollment_year",
                        columnNames = {
                                "student_id",
                                "academic_year_id"
                        }
                )
        }
)
public class StudentEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false
    )
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "grade_id",
            nullable = false
    )
    private Grade grade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "section_id",
            nullable = false
    )
    private Section section;

    @Column(
            name = "active",
            nullable = false
    )
    private boolean active;

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