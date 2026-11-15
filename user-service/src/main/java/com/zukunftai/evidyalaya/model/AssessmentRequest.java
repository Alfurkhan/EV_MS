package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.AssessmentTimingMode;
import com.zukunftai.evidyalaya.database.AssessmentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssessmentRequest {
    @NotBlank @Size(max = 200)
    private String title;
    @Size(max = 20000)
    private String description;
    @NotNull private AssessmentType assessmentType;
    @NotNull private Long academicYearId;
    @NotNull private Long gradeId;
    @NotNull private Long sectionId;
    @NotNull private Long subjectId;
    @NotNull private AssessmentTimingMode timingMode;
    @NotNull private LocalDateTime availableFrom;
    @NotNull private LocalDateTime availableUntil;
    @Min(1) private Integer durationMinutes;
    private boolean allowOvertime;
    @NotNull @DecimalMin(value = "0.01")
    private BigDecimal totalMarks;
    @Valid private List<@NotNull AssessmentQuestionRequest> questions;
}