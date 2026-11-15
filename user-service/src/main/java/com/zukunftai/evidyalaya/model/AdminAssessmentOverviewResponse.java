package com.zukunftai.evidyalaya.model;
import com.zukunftai.evidyalaya.database.AssessmentStatus;
import com.zukunftai.evidyalaya.database.AssessmentType;
import com.zukunftai.evidyalaya.database.AssessmentTimingMode;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public class AdminAssessmentOverviewResponse {
 @Getter @Builder
 public static class Item {
  private Long id; private String title; private AssessmentType assessmentType; private AssessmentStatus status;
  private String subjectName; private String facultyName; private String gradeName; private String sectionName;
  private LocalDateTime availableFrom; private LocalDateTime availableUntil; private AssessmentTimingMode timingMode;
  private BigDecimal totalMarks; private boolean resultsPublished; private long submittedCount;
  private long activeCount; private long pendingEvaluationCount;
 }
 @Getter @Builder
 public static class Detail {
  private Item assessment; private long totalAttempts; private long submittedCount;
  private long activeCount; private long evaluatedCount; private long pendingEvaluationCount;
 }
}
