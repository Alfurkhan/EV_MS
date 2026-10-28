package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Assignment;
import com.zukunftai.evidyalaya.database.AssignmentSubmission;
import com.zukunftai.evidyalaya.model.AssignmentGradeRequest;
import com.zukunftai.evidyalaya.model.AssignmentRequest;
import com.zukunftai.evidyalaya.model.AssignmentSubmissionRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.nio.file.Path;

public interface AssignmentService {
    Assignment createDraft(AssignmentRequest request);
    Assignment updateDraft(Long id, AssignmentRequest request);
    Assignment publish(Long id);
    void deleteDraft(Long id);
    List<Assignment> getFacultyAssignments();
    List<Assignment> getStudentAssignments();
    List<Assignment> getAdminAssignments();
    AssignmentSubmission submit(Long assignmentId, AssignmentSubmissionRequest request);
    AssignmentSubmission uploadSubmissionAttachment(Long assignmentId, MultipartFile file);
    List<AssignmentSubmission> getStudentSubmissions();
    List<AssignmentSubmission> getSubmissionsForFaculty(Long assignmentId);
    AssignmentSubmission gradeSubmission(Long submissionId, AssignmentGradeRequest request);
    Assignment uploadAssignmentAttachment(Long assignmentId, MultipartFile file);
    Assignment getAssignmentForAttachment(Long assignmentId);
    AssignmentSubmission getSubmissionForAttachment(Long submissionId);
    Path resolveStoredAttachment(String storedPath);
}
