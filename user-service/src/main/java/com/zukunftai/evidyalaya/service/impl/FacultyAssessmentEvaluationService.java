package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class FacultyAssessmentEvaluationService {
    private final AssessmentRepository assessments;
    private final AssessmentAttemptRepository attempts;
    private final AssessmentQuestionRepository questions;
    private final AssessmentAnswerRepository answers;
    private final UserRepository users;

    public FacultyAssessmentEvaluationService(AssessmentRepository assessments,
            AssessmentAttemptRepository attempts, AssessmentQuestionRepository questions,
            AssessmentAnswerRepository answers, UserRepository users) {
        this.assessments = assessments;
        this.attempts = attempts;
        this.questions = questions;
        this.answers = answers;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<FacultyEvaluationAttemptResponse> listAttempts(Long assessmentId) {
        Assessment assessment = ownedAssessment(assessmentId);
        return attempts.findAll().stream()
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .sorted(Comparator.comparing(AssessmentAttempt::getSubmittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FacultyEvaluationAttemptResponse getAttempt(Long assessmentId, Long attemptId) {
        Assessment assessment = ownedAssessment(assessmentId);
        AssessmentAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> error("Submitted attempt not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_ATTEMPT_NOT_FOUND"));
        return toResponse(attempt);
    }

    public FacultyEvaluationAttemptResponse evaluateAnswer(Long assessmentId, Long attemptId,
            Long questionId, FacultyAnswerEvaluationRequest request) {
        Assessment assessment = ownedAssessment(assessmentId);
        AssessmentAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getAssessment().getId().equals(assessment.getId()))
                .filter(a -> a.getStatus() != AssessmentAttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> error("Submitted attempt not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_ATTEMPT_NOT_FOUND"));
        AssessmentQuestion question = questions.findById(questionId)
                .filter(q -> q.getAssessment().getId().equals(assessmentId))
                .orElseThrow(() -> error("Question not found.", HttpStatus.NOT_FOUND, "ASSESSMENT_QUESTION_NOT_FOUND"));
        if (question.getQuestionType() != AssessmentQuestionType.SHORT_ANSWER
                && question.getQuestionType() != AssessmentQuestionType.DESCRIPTIVE) {
            throw error("Only short-answer and descriptive responses can be manually evaluated.",
                    HttpStatus.BAD_REQUEST, "ASSESSMENT_QUESTION_NOT_MANUAL");
        }
        if (request.getMarksAwarded() == null || request.getMarksAwarded().signum() < 0
                || request.getMarksAwarded().compareTo(question.getMarks()) > 0) {
            throw error("Awarded marks must be between zero and the question's maximum marks.",
                    HttpStatus.BAD_REQUEST, "ASSESSMENT_INVALID_AWARDED_MARKS");
        }
        Instant now = Instant.now();
        AssessmentAnswer answer = answers.findByAttemptIdAndQuestionId(attemptId, questionId)
                .orElseGet(() -> AssessmentAnswer.builder().attempt(attempt).question(question)
                        .createdAt(now).build());
        answer.setMarksAwarded(request.getMarksAwarded());
        answer.setFeedback(request.getFeedback() == null ? null : request.getFeedback().trim());
        answer.setEvaluatedBy(currentUser());
        answer.setEvaluatedAt(now);
        answer.setUpdatedAt(now);
        answers.save(answer);
        recalculateScore(attempt);
        attempt.setUpdatedAt(now);
        attempts.save(attempt);
        return toResponse(attempt);
    }

    private void recalculateScore(AssessmentAttempt attempt) {
        BigDecimal score = answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId()).stream()
                .map(AssessmentAnswer::getMarksAwarded).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        attempt.setScore(score);
    }

    private FacultyEvaluationAttemptResponse toResponse(AssessmentAttempt attempt) {
        List<AssessmentQuestion> allQuestions = questions.findByAssessmentIdOrderByPositionAsc(attempt.getAssessment().getId());
        Map<Long, AssessmentAnswer> byQuestion = answers.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId())
                .stream().collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity()));
        List<FacultyEvaluationAnswerResponse> responseAnswers = allQuestions.stream().map(q -> {
            AssessmentAnswer a = byQuestion.get(q.getId());
            boolean manual = q.getQuestionType() == AssessmentQuestionType.SHORT_ANSWER
                    || q.getQuestionType() == AssessmentQuestionType.DESCRIPTIVE;
            return FacultyEvaluationAnswerResponse.builder().questionId(q.getId())
                    .questionText(q.getQuestionText()).questionType(q.getQuestionType())
                    .options(q.getOptions()).correctAnswer(q.getCorrectAnswer())
                    .submittedAnswer(a == null ? null : a.getAnswer()).maximumMarks(q.getMarks())
                    .marksAwarded(a == null ? null : a.getMarksAwarded())
                    .feedback(a == null ? null : a.getFeedback()).manualEvaluation(manual).build();
        }).toList();
        boolean complete = responseAnswers.stream().filter(FacultyEvaluationAnswerResponse::isManualEvaluation)
                .allMatch(a -> a.getSubmittedAnswer() == null || a.getMarksAwarded() != null);
        return FacultyEvaluationAttemptResponse.builder().attemptId(attempt.getId())
                .assessmentId(attempt.getAssessment().getId()).assessmentTitle(attempt.getAssessment().getTitle())
                .studentName(attempt.getStudent().getFullName()).studentUsername(attempt.getStudent().getUsername())
                .status(attempt.getStatus()).startedAt(attempt.getStartedAt()).submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore()).totalMarks(attempt.getAssessment().getTotalMarks())
                .evaluationComplete(complete).answers(responseAnswers).build();
    }

    private Assessment ownedAssessment(Long id) {
        return assessments.findByIdAndFaculty(id, currentUser())
                .orElseThrow(() -> error("Assessment not found or you do not own it.", HttpStatus.NOT_FOUND, "ASSESSMENT_NOT_FOUND"));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw error("User is not authenticated.", HttpStatus.UNAUTHORIZED, "USER_NOT_AUTHENTICATED");
        return users.findByUsername(auth.getName())
                .orElseThrow(() -> error("User not found.", HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
    }

    private APIException error(String message, HttpStatus status, String code) {
        return new APIException(message, status, code);
    }
}
