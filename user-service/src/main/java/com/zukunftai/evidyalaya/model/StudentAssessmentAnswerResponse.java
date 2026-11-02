package com.zukunftai.evidyalaya.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class StudentAssessmentAnswerResponse {
    private Long questionId;
    private JsonNode answer;
}
