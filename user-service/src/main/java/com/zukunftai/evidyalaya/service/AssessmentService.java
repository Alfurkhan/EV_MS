package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.model.AssessmentRequest;
import com.zukunftai.evidyalaya.model.AssessmentParticipationReportResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface AssessmentService {
    List<Assessment> getFacultyAssessments();
    Assessment getFacultyAssessment(Long id);
    Assessment createDraft(AssessmentRequest request);
    Assessment createDraftForFaculty(Long facultyId, AssessmentRequest request);
    Assessment publishForAdmin(Long id);
    Assessment updateDraft(Long id, AssessmentRequest request);
    Assessment publish(Long id);
    void deleteDraft(Long id);
    AssessmentParticipationReportResponse getParticipationReport(Long id);
    Assessment uploadAttachment(Long id, MultipartFile file);
    Assessment uploadAttachmentForAdmin(Long id, MultipartFile file);
    Assessment getAssessmentForAttachment(Long id);
    Path resolveStoredAttachment(String storedPath);
}