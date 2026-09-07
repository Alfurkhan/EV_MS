package com.zukunftai.evidyalaya.database;

import com.zukunftai.evidyalaya.database.Grade;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "\"subject\"",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "name"),
                @UniqueConstraint(columnNames = "code")
        }
)
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToMany
    @JoinTable(
            name = "subject_faculty",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name = "faculty_id")
    )
    @Builder.Default
    private Set<User> faculties = new HashSet<>();

    @ManyToMany(mappedBy = "subjects")
    @Builder.Default
    private Set<Grade> grades = new HashSet<>();
}