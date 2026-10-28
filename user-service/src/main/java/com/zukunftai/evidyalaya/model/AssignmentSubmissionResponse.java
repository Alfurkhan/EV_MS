package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AssignmentSubmissionResponse {
    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String responseText;
    private Instant submittedAt;
    private boolean late;
    private BigDecimal marks;
    private BigDecimal maxMarks;
    private String feedback;
    private Instant gradedAt;
    private boolean hasAttachment;
    private String attachmentName;
    private Instant updatedAt;
}
