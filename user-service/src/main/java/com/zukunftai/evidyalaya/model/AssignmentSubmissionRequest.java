package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AssignmentSubmissionRequest {
    @Size(max = 20000)
    private String responseText;
}
