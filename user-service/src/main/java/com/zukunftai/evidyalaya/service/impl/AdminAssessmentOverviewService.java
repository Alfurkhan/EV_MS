package com.zukunftai.evidyalaya.service.impl;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.AdminAssessmentOverviewResponse;
import com.zukunftai.evidyalaya.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminAssessmentOverviewService {
 private final AssessmentRepository assessments;
 private final AssessmentAttemptRepository attempts;
 private final AssessmentQuestionRepository questions;
 private final AssessmentAnswerRepository answers;
 public AdminAssessmentOverviewService(AssessmentRepository assessments, AssessmentAttemptRepository attempts,
   AssessmentQuestionRepository questions, AssessmentAnswerRepository answers) {
  this.assessments=assessments; this.attempts=attempts; this.questions=questions; this.answers=answers;
 }
 public List<AdminAssessmentOverviewResponse.Item> list() {
  return assessments.findAll().stream().sorted(Comparator.comparing(Assessment::getCreatedAt).reversed())
   .map(this::item).toList();
 }
 public AdminAssessmentOverviewResponse.Detail detail(Long id) {
  Assessment a=assessments.findById(id).orElseThrow(()->new APIException("Assessment not found.",HttpStatus.NOT_FOUND,"ASSESSMENT_NOT_FOUND"));
  List<AssessmentAttempt> rows=attempts.findAll().stream().filter(x->x.getAssessment().getId().equals(id)).toList();
  long active=rows.stream().filter(x->x.getStatus()==AssessmentAttemptStatus.IN_PROGRESS).count();
  long submitted=rows.size()-active;
  long pending=rows.stream().filter(x->x.getStatus()!=AssessmentAttemptStatus.IN_PROGRESS).filter(x->!complete(x)).count();
  return AdminAssessmentOverviewResponse.Detail.builder().assessment(item(a)).totalAttempts(rows.size())
   .submittedCount(submitted).activeCount(active).pendingEvaluationCount(pending)
   .evaluatedCount(submitted-pending).build();
 }
 private AdminAssessmentOverviewResponse.Item item(Assessment a) {
  List<AssessmentAttempt> rows=attempts.findAll().stream().filter(x->x.getAssessment().getId().equals(a.getId())).toList();
  long active=rows.stream().filter(x->x.getStatus()==AssessmentAttemptStatus.IN_PROGRESS).count();
  long submitted=rows.size()-active;
  long pending=rows.stream().filter(x->x.getStatus()!=AssessmentAttemptStatus.IN_PROGRESS).filter(x->!complete(x)).count();
  return AdminAssessmentOverviewResponse.Item.builder().id(a.getId()).title(a.getTitle())
   .assessmentType(a.getAssessmentType()).status(a.getStatus()).subjectName(a.getSubject().getName())
   .facultyName(a.getFaculty().getFullName()).gradeName(a.getGrade().getName()).sectionName(a.getSection().getName())
   .availableFrom(a.getAvailableFrom()).availableUntil(a.getAvailableUntil()).timingMode(a.getTimingMode())
   .totalMarks(a.getTotalMarks()).resultsPublished(a.isResultsPublished()).submittedCount(submitted)
   .activeCount(active).pendingEvaluationCount(pending).build();
 }
 private boolean complete(AssessmentAttempt attempt) {
  Set<Long> evaluated=answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId()).stream()
   .filter(x->x.getMarksAwarded()!=null).map(x->x.getQuestion().getId()).collect(Collectors.toSet());
  return questions.findByAssessmentIdOrderByPositionAsc(attempt.getAssessment().getId()).stream()
   .filter(q->q.getQuestionType()==AssessmentQuestionType.SHORT_ANSWER||q.getQuestionType()==AssessmentQuestionType.DESCRIPTIVE)
   .allMatch(q->!answers.findByAttemptIdAndQuestionId(attempt.getId(),q.getId()).map(x->x.getAnswer()!=null&&!x.getAnswer().isNull()).orElse(false)||evaluated.contains(q.getId()));
 }
}
