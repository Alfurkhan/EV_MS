package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.AssignmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentResponse {
    private Long id;
    private String title;
    private String instructions;
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
    private LocalDateTime dueAt;
    private AssignmentStatus status;
    private boolean hasAttachment;
    private String attachmentName;
    private Long submissionCount;
    private Instant createdAt;
    private Instant updatedAt;
}
