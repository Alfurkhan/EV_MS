package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "grade",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_grade_academic_year_name",
                        columnNames = {
                                "academic_year_id",
                                "name"
                        }
                )
        }
)
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false
    )
    private AcademicYear academicYear;

    @ManyToMany
    @JoinTable(
            name = "grade_subject",
            joinColumns = @JoinColumn(name = "grade_id"),
            inverseJoinColumns = @JoinColumn(name = "subject_id")
    )
    @Builder.Default
    private Set<Subject> subjects = new HashSet<>();

    @Column(
            name = "name",
            nullable = false,
            length = 50
    )
    private String name;

    @Column(
            name = "description",
            length = 500
    )
    private String description;

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