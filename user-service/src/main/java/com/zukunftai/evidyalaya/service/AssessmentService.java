package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface AssessmentService {
    List<Assessment> getFacultyAssessments();
    Assessment getFacultyAssessment(Long id);
    Assessment createDraft(AssessmentRequest request);
    Assessment updateDraft(Long id, AssessmentRequest request);
    Assessment publish(Long id);
    void deleteDraft(Long id);
    Assessment uploadAttachment(Long id, MultipartFile file);
    Assessment getAssessmentForAttachment(Long id);
    Path resolveStoredAttachment(String storedPath);
}