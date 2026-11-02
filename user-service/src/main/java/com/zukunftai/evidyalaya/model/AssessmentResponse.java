package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.*;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AssessmentResponse {
    private Long id;
    private String title;
    private String description;
    private AssessmentType assessmentType;
    private AssessmentStatus status;
    private Long academicYearId;
    private String academicYearName;
    private Long gradeId;
    private String gradeName;
    private Long sectionId;
    private String sectionName;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Long facultyId;
    private String facultyName;
    private AssessmentTimingMode timingMode;
    private LocalDateTime availableFrom;
    private LocalDateTime availableUntil;
    private Integer durationMinutes;
    private boolean allowOvertime;
    private BigDecimal totalMarks;
    private LocalDateTime publishedAt;
    private boolean resultsPublished;
    private Instant createdAt;
    private Instant updatedAt;
    private List<AssessmentQuestionResponse> questions;
    private boolean hasAttachment;
    private String attachmentName;
    private Long attachmentSize;
}