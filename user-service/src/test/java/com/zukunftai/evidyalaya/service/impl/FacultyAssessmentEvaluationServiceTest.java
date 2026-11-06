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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacultyAssessmentEvaluationServiceTest {

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
    void publishesFirstResultSnapshotAndNotifiesOnlyStudentsWhoAttempted() {
        Fixture fixture = fixture(false, 0, 0);

        service.publishResults(55L);

        assertEquals(true, fixture.assessment().isResultsPublished());
        assertEquals(0L, fixture.assessment().getPublishedResultsRevision());
        assertEquals(new BigDecimal("8.00"), fixture.attempt().getPublishedScore());
        ArgumentCaptor<NotificationCommand> command = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyList(), command.capture());
        assertEquals("RESULT", command.getValue().sourceType());
        assertEquals("/my-assessments", command.getValue().targetUrl());
        assertEquals("RESULT:ASSESSMENT:55:REVISION:0", command.getValue().deduplicationKeyPrefix());
        verify(attempts).saveAll(List.of(fixture.attempt()));
    }

    @Test
    void republishesChangedRevisionAndKeepsNewPublishedSnapshot() {
        Fixture fixture = fixture(true, 3, 2);
        fixture.attempt().setPublishedScore(new BigDecimal("6.00"));

        service.publishResults(55L);

        assertEquals(3L, fixture.assessment().getPublishedResultsRevision());
        assertEquals(new BigDecimal("8.00"), fixture.attempt().getPublishedScore());
        ArgumentCaptor<NotificationCommand> command = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyList(), command.capture());
        assertEquals("Assessment results updated", command.getValue().title());
        assertEquals("RESULT:ASSESSMENT:55:REVISION:3", command.getValue().deduplicationKeyPrefix());
    }

    @Test
    void doesNotNotifyAgainWhenTheSameRevisionIsPublishedTwice() {
        Fixture fixture = fixture(true, 3, 3);

        service.publishResults(55L);

        verify(notificationService, never()).createForUsers(anyList(), any(NotificationCommand.class));
        verify(attempts, never()).saveAll(anyList());
        assertEquals(new BigDecimal("6.00"), fixture.attempt().getPublishedScore());
    }

    private Fixture fixture(boolean alreadyPublished, long revision, long publishedRevision) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty", "test",
                        List.of(new SimpleGrantedAuthority("ROLE_FACULTY"))));

        User faculty = User.builder().id(10L).username("faculty").build();
        User student = User.builder().id(20L).fullName("Student One").build();
        Subject subject = Subject.builder().id(30L).name("Mathematics").build();
        Assessment assessment = Assessment.builder().id(55L).title("Unit Test 1")
                .subject(subject).faculty(faculty).resultsPublished(alreadyPublished)
                .resultsRevision(revision).publishedResultsRevision(publishedRevision)
                .totalMarks(new BigDecimal("10.00")).build();
        AssessmentAttempt attempt = AssessmentAttempt.builder().id(70L).assessment(assessment)
                .student(student).status(AssessmentAttemptStatus.SUBMITTED)
                .score(new BigDecimal("8.00"))
                .publishedScore(alreadyPublished ? new BigDecimal("6.00") : null)
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
        lenient().when(attempts.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(assessments.save(any(Assessment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        return new Fixture(assessment, attempt);
    }

    private record Fixture(Assessment assessment, AssessmentAttempt attempt) {}
}
