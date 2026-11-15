package com.zukunftai.evidyalaya.database;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "assignment_submission",
       uniqueConstraints = @UniqueConstraint(name = "uk_assignment_submission_student",
               columnNames = {"assignment_id", "student_id"}))
public class AssignmentSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "attachment_path", length = 1000)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_content_type", length = 150)
    private String attachmentContentType;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "marks", precision = 7, scale = 2)
    private BigDecimal marks;

    @Column(name = "max_marks", precision = 7, scale = 2)
    private BigDecimal maxMarks;

    @Column(name = "feedback", length = 4000)
    private String feedback;

    @Column(name = "graded_at")
    private Instant gradedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
