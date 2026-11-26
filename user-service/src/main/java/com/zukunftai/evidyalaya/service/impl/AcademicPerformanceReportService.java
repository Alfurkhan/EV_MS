package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.ReportData;
import com.zukunftai.evidyalaya.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademicPerformanceReportService {
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentAnswerRepository answerRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final ReportService reportService;

    public ReportData preview(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found."));
        List<StudentEnrollment> enrollments = enrollmentRepository
                .findByAcademicYearAndGradeAndSectionAndActiveTrue(assessment.getAcademicYear(), assessment.getGrade(), assessment.getSection());
        Map<Long, AssessmentAttempt> attempts = new HashMap<>();
        attemptRepository.findByAssessment(assessment).forEach(a -> attempts.put(a.getStudent().getId(), a));
        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderByPositionAsc(assessment.getId());
        List<List<String>> rows = new ArrayList<>();
        BigDecimal highest = null, lowest = null, sum = BigDecimal.ZERO;
        int officialCount = 0, submittedCount = 0, activeCount = 0, pendingCount = 0;
        int[] performanceBands = new int[4];
        for (StudentEnrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            AssessmentAttempt attempt = attempts.get(student.getId());
            String status = "Not Started";
            String marks = "-", percentage = "-";
            if (attempt != null) {
                if (attempt.getStatus() == AssessmentAttemptStatus.IN_PROGRESS) {
                    status = "In Progress"; activeCount++;
                } else {
                    submittedCount++;
                    status = attempt.getStatus() == AssessmentAttemptStatus.AUTO_SUBMITTED ? "Auto Submitted" : "Submitted";
                    if (assessment.isResultsPublished() && attempt.getPublishedScore() != null) {
                        BigDecimal score = attempt.getPublishedScore();
                        BigDecimal total = assessment.getTotalMarks();
                        marks = score.setScale(2, RoundingMode.HALF_UP).toPlainString();
                        percentage = total.signum() > 0 ? score.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP).toPlainString() + "%" : "-";
                        sum = sum.add(score); officialCount++;
                        highest = highest == null || score.compareTo(highest) > 0 ? score : highest;
                        lowest = lowest == null || score.compareTo(lowest) < 0 ? score : lowest;
                    } else if (!evaluationComplete(attempt, questions)) {
                        pendingCount++;
                        status = "Evaluation Pending";
                    } else status = assessment.isResultsPublished() ? "Result Unavailable" : "Evaluated · Unpublished";
                }
            }
            rows.add(List.of(safe(student.getFullName()), safe(student.getUsername()), status, marks,
                    assessment.getTotalMarks().setScale(2, RoundingMode.HALF_UP).toPlainString(), percentage));
        }
        BigDecimal average = officialCount == 0 ? BigDecimal.ZERO : sum.divide(BigDecimal.valueOf(officialCount), 2, RoundingMode.HALF_UP);
        List<ReportData.SummaryMetric> metrics = List.of(
                metric("Enrolled", enrollments.size()), metric("Submitted", submittedCount),
                metric("In Progress", activeCount), metric("Pending Evaluation", pendingCount),
                metric("Official Results", officialCount), metric("Average Marks", officialCount == 0 ? "—" : average + " / " + assessment.getTotalMarks()),
                metric("Highest", highest == null ? "—" : highest + " / " + assessment.getTotalMarks()),
                metric("Lowest", lowest == null ? "—" : lowest + " / " + assessment.getTotalMarks()));
        String generated = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        String title = "Academic Performance Report";
        String subtitle = assessment.getTitle() + " · " + assessment.getSubject().getName() + " · "
                + assessment.getGrade().getName() + " " + assessment.getSection().getName()
                + " · Faculty: " + safe(assessment.getFaculty().getFullName())
                + " · " + (assessment.isResultsPublished() ? "Published Results" : "Results Not Published");
        List<ReportData.ReportSection> sections = List.of(ReportData.ReportSection.builder()
                .title("Published Result Distribution")
                .columns(List.of("Performance Band", "Students", "Share of Published Results"))
                .rows(List.of(
                        bandRow("Excellent (90–100%)", performanceBands[0], officialCount),
                        bandRow("Good (75–89%)", performanceBands[1], officialCount),
                        bandRow("Satisfactory (60–74%)", performanceBands[2], officialCount),
                        bandRow("Needs Improvement (<60%)", performanceBands[3], officialCount)))
                .build());
        return reportService.buildCustomReport(title, assessment.getAcademicYear().getName(),
                List.of("Student Name", "Student ID", "Status", "Marks Obtained", "Maximum Marks", "Percentage"),
                rows, subtitle, metrics, sections);
    }

    public byte[] export(Long assessmentId, String format) {
        return reportService.exportCustomReport(preview(assessmentId), format);
    }

    private boolean evaluationComplete(AssessmentAttempt attempt, List<AssessmentQuestion> questions) {
        for (AssessmentQuestion question : questions) {
            if (question.getQuestionType() != AssessmentQuestionType.SHORT_ANSWER
                    && question.getQuestionType() != AssessmentQuestionType.DESCRIPTIVE) continue;
            AssessmentAnswer answer = answerRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).orElse(null);
            if (answer != null && answer.getAnswer() != null && !answer.getAnswer().isNull() && answer.getMarksAwarded() == null) return false;
        }
        return true;
    }
    private List<String> bandRow(String label, int count, int total) {
        String share = total == 0 ? "—" : BigDecimal.valueOf(count * 100L).divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP).toPlainString() + "%";
        return List.of(label, String.valueOf(count), share);
    }
    private ReportData.SummaryMetric metric(String label, Object value) {
        return ReportData.SummaryMetric.builder().label(label).value(String.valueOf(value)).build();
    }
    private String safe(String value) { return value == null ? "" : value; }
}
