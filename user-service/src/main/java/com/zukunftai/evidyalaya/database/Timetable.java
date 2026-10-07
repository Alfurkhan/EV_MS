package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "timetable",
        indexes = {
                @Index(name = "idx_timetable_academic_year", columnList = "academic_year_id"),
                @Index(name = "idx_timetable_grade", columnList = "grade_id"),
                @Index(name = "idx_timetable_section", columnList = "section_id"),
                @Index(name = "idx_timetable_subject", columnList = "subject_id"),
                @Index(name = "idx_timetable_faculty", columnList = "faculty_id"),
                @Index(name = "idx_timetable_day", columnList = "day_of_week"),
                @Index(name = "idx_timetable_start_date", columnList = "start_date"),
                @Index(name = "idx_timetable_end_date", columnList = "end_date")
        }
)
public class Timetable {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "subject_id",
            nullable = false
    )
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "faculty_id",
            nullable = false
    )
    private User faculty;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "day_of_week",
            nullable = false,
            length = 10
    )
    private DayOfWeek dayOfWeek;

    @Column(
            name = "start_time",
            nullable = false
    )
    private LocalTime startTime;

    @Column(
            name = "end_time",
            nullable = false
    )
    private LocalTime endTime;

    /**
     * Defines whether this is an online or offline class.
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "class_type",
            nullable = false,
            length = 20
    )
    private ClassType classType;

    /**
     * Meeting platform detected from the online meeting link.
     * Null for offline classes.
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "meeting_platform",
            length = 30
    )
    private MeetingPlatform meetingPlatform;

    /**
     * First date on which this recurring timetable rule is valid.
     */
    @Column(
            name = "start_date",
            nullable = false
    )
    private LocalDate startDate;

    /**
     * Last date on which this recurring timetable rule is valid.
     * The end date is inclusive.
     */
    @Column(
            name = "end_date",
            nullable = false
    )
    private LocalDate endDate;

    /**
     * Used only for offline classes.
     */
    @Column(
            name = "room",
            length = 100
    )
    private String room;

    /**
     * Used only for online classes.
     */
    @Column(
            name = "meeting_link",
            length = 500
    )
    private String meetingLink;

    @Column(
            name = "notes",
            length = 500
    )
    private String notes;

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