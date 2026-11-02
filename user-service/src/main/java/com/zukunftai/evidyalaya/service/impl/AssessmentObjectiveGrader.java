package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.repository.AssessmentAnswerRepository;
import com.zukunftai.evidyalaya.repository.AssessmentQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class AssessmentObjectiveGrader {
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentAnswerRepository answerRepository;

    /** Grades exact-match objective answers. Subjective answers remain pending faculty review. */
    @Transactional
    public void gradeObjectiveAnswers(AssessmentAttempt attempt) {
        for (AssessmentQuestion question : questionRepository.findByAssessmentIdOrderByPositionAsc(attempt.getAssessment().getId())) {
            AssessmentQuestionType type = question.getQuestionType();
            boolean objective = type == AssessmentQuestionType.MCQ
                    || type == AssessmentQuestionType.MULTIPLE_SELECT
                    || type == AssessmentQuestionType.TRUE_FALSE;
            if (!objective) continue;
            AssessmentAnswer answer = answerRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).orElse(null);
            if (answer == null) continue;
            boolean correct = question.getCorrectAnswer() != null && answer.getAnswer() != null
                    && question.getCorrectAnswer().equals(answer.getAnswer());
            answer.setMarksAwarded(correct ? question.getMarks() : BigDecimal.ZERO);
            answer.setFeedback(correct ? "Correct" : "Incorrect");
            answer.setEvaluatedAt(Instant.now());
            answer.setUpdatedAt(Instant.now());
            answerRepository.save(answer);
        }
        BigDecimal score = answerRepository.findByAttemptIdOrderByQuestionPositionAsc(attempt.getId()).stream()
                .map(AssessmentAnswer::getMarksAwarded).filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        attempt.setScore(score);
    }
}
