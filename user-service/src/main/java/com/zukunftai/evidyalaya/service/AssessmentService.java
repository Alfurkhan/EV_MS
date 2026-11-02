package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import java.util.List;

public interface AssessmentService {
    List<Assessment> getFacultyAssessments();
    Assessment getFacultyAssessment(Long id);
    Assessment createDraft(AssessmentRequest request);
    Assessment updateDraft(Long id, AssessmentRequest request);
    Assessment publish(Long id);
}