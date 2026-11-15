package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacultyAssessmentResultEmailSnapshotTest {

    @Mock private AssessmentRepository assessments;
    @Mock private AssessmentAttemptRepository attempts;
    @Mock private AssessmentQuestionRepository questions;
    @Mock private AssessmentAnswerRepository answers;
    @Mock private UserRepository users;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private FacultyAssessmentEvaluationService service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void snapshotsPublishedMarksAndPercentageForTheMatchingStudent() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty", "test",
                        List.of(new SimpleGrantedAuthority("ROLE_FACULTY"))));

        User faculty = User.builder().id(10L).username("faculty").build();
        User student = User.builder().id(20L).fullName("Student One").build();
        Subject subject = Subject.builder().id(30L).name("Mathematics").build();
        Assessment assessment = Assessment.builder().id(55L).title("Unit Test 1")
                .subject(subject).faculty(faculty).resultsPublished(false)
                .resultsRevision(2).publishedResultsRevision(1)
                .totalMarks(new BigDecimal("10.00")).build();
        AssessmentAttempt attempt = AssessmentAttempt.builder().id(70L).assessment(assessment)
                .student(student).status(AssessmentAttemptStatus.SUBMITTED)
                .score(new BigDecimal("8.00"))
                .startedAt(Instant.parse("2026-11-01T08:00:00Z"))
                .deadlineAt(Instant.parse("2026-11-01T09:00:00Z"))
                .submittedAt(Instant.parse("2026-11-01T08:45:00Z"))
                .createdAt(Instant.parse("2026-11-01T08:00:00Z"))
                .updatedAt(Instant.parse("2026-11-01T08:45:00Z")).build();

        when(users.findByUsername("faculty")).thenReturn(Optional.of(faculty));
        when(assessments.findByIdAndFaculty(55L, faculty)).thenReturn(Optional.of(assessment));
        when(attempts.findByAssessment(assessment)).thenReturn(List.of(attempt));
        when(questions.findByAssessmentIdOrderByPositionAsc(55L)).thenReturn(List.of());
        when(answers.findByAttemptIdOrderByQuestionPositionAsc(70L)).thenReturn(List.of());

        service.publishResults(55L);

        ArgumentCaptor<NotificationCommand> captor = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyList(), captor.capture());
        Map<String, Object> snapshot = captor.getValue().recipientEmailData().get(20L);
        assertEquals("Unit Test 1", snapshot.get("assessmentTitle"));
        assertEquals("Mathematics", snapshot.get("subjectName"));
        assertEquals("8.00", snapshot.get("resultScore"));
        assertEquals("10.00", snapshot.get("resultTotalMarks"));
        assertEquals("80.00", snapshot.get("resultPercentage"));
        assertEquals(new BigDecimal("8.00"), attempt.getPublishedScore());
    }
}
