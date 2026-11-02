package com.zukunftai.evidyalaya.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.repository.AssessmentAnswerRepository;
import com.zukunftai.evidyalaya.repository.AssessmentQuestionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentObjectiveGraderTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Mock
    private AssessmentQuestionRepository questionRepository;

    @Mock
    private AssessmentAnswerRepository answerRepository;

    @InjectMocks
    private AssessmentObjectiveGrader grader;

    @Test
    void gradesSingleChoiceAndMultipleSelectAnswers() throws Exception {
        Assessment assessment = Assessment.builder().id(10L).build();
        AssessmentAttempt attempt = AssessmentAttempt.builder().id(20L).assessment(assessment).build();

        AssessmentQuestion singleChoice = question(1L, assessment, AssessmentQuestionType.MCQ,
                "[0]", "2.00");
        AssessmentQuestion multipleSelect = question(2L, assessment, AssessmentQuestionType.MULTIPLE_SELECT,
                "[1,0]", "3.00");
        AssessmentQuestion incorrectChoice = question(3L, assessment, AssessmentQuestionType.TRUE_FALSE,
                "1", "4.00");

        AssessmentAnswer correctSingle = answer(attempt, singleChoice, "0");
        AssessmentAnswer correctMultiple = answer(attempt, multipleSelect, "[0,1]");
        AssessmentAnswer incorrect = answer(attempt, incorrectChoice, "0");

        when(questionRepository.findByAssessmentIdOrderByPositionAsc(10L))
                .thenReturn(List.of(singleChoice, multipleSelect, incorrectChoice));
        when(answerRepository.findByAttemptIdAndQuestionId(20L, 1L)).thenReturn(Optional.of(correctSingle));
        when(answerRepository.findByAttemptIdAndQuestionId(20L, 2L)).thenReturn(Optional.of(correctMultiple));
        when(answerRepository.findByAttemptIdAndQuestionId(20L, 3L)).thenReturn(Optional.of(incorrect));
        when(answerRepository.findByAttemptIdOrderByQuestionPositionAsc(20L))
                .thenReturn(List.of(correctSingle, correctMultiple, incorrect));

        grader.gradeObjectiveAnswers(attempt);

        assertEquals(new BigDecimal("5.00"), attempt.getScore());
        assertEquals(new BigDecimal("2.00"), correctSingle.getMarksAwarded());
        assertEquals(new BigDecimal("3.00"), correctMultiple.getMarksAwarded());
        assertEquals(BigDecimal.ZERO, incorrect.getMarksAwarded());
        verify(answerRepository, times(3)).save(any(AssessmentAnswer.class));
    }

    @Test
    void leavesMissingObjectiveAnswersAtZeroScore() {
        Assessment assessment = Assessment.builder().id(11L).build();
        AssessmentAttempt attempt = AssessmentAttempt.builder().id(21L).assessment(assessment).build();
        AssessmentQuestion question = question(4L, assessment, AssessmentQuestionType.MCQ, "0", "5.00");

        when(questionRepository.findByAssessmentIdOrderByPositionAsc(11L)).thenReturn(List.of(question));
        when(answerRepository.findByAttemptIdAndQuestionId(21L, 4L)).thenReturn(Optional.empty());
        when(answerRepository.findByAttemptIdOrderByQuestionPositionAsc(21L)).thenReturn(List.of());

        grader.gradeObjectiveAnswers(attempt);

        assertEquals(BigDecimal.ZERO, attempt.getScore());
        verify(answerRepository, never()).save(any(AssessmentAnswer.class));
    }

    private AssessmentQuestion question(Long id, Assessment assessment, AssessmentQuestionType type,
            String correctAnswer, String marks) throws Exception {
        return AssessmentQuestion.builder().id(id).assessment(assessment).questionType(type)
                .correctAnswer(mapper.readTree(correctAnswer)).marks(new BigDecimal(marks)).build();
    }

    private AssessmentAnswer answer(AssessmentAttempt attempt, AssessmentQuestion question,
            String submittedAnswer) throws Exception {
        return AssessmentAnswer.builder().attempt(attempt).question(question)
                .answer(mapper.readTree(submittedAnswer)).build();
    }
}
