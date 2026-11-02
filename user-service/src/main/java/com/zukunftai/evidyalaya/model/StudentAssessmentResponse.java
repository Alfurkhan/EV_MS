package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.AssessmentType;
import com.zukunftai.evidyalaya.database.AssessmentTimingMode;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.Instant;
import java.math.BigDecimal;

@Data @Builder
public class StudentAssessmentResponse {
    private Long id;
    private String title;
    private String description;
    private AssessmentType assessmentType;
    private String subjectName;
    private String facultyName;
    private String gradeName;
    private String sectionName;
    private AssessmentTimingMode timingMode;
    private LocalDateTime availableFrom;
    private LocalDateTime availableUntil;
    private Integer durationMinutes;
    private BigDecimal totalMarks;
    private String availability;
    private boolean attempted;
    private Long attemptId;
    private String attemptStatus;
    private Instant attemptDeadline;
    private boolean hasAttachment;
    private String attachmentName;
}
