package com.zukunftai.evidyalaya.model;

import com.zukunftai.evidyalaya.database.AssessmentQuestionType;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class StudentAssessmentQuestionResponse {
    private Long id;
    private String questionText;
    private AssessmentQuestionType questionType;
    private List<String> options;
    private BigDecimal marks;
    private Integer position;
}
