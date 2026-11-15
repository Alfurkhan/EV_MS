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
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassSessionServiceImplTest {

    @Mock private ClassSessionRepository classSessionRepository;
    @Mock private TimetableRepository timetableRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentEnrollmentRepository studentEnrollmentRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ClassSessionServiceImpl service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void notifiesActiveStudentsWhenOnlineClassStarts() {
        Fixture fixture = fixture(ClassType.ONLINE);

        service.startClass(70L);

        ArgumentCaptor<NotificationCommand> command =
                ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyCollection(), command.capture());
        assertEquals("CLASS_SESSION", command.getValue().sourceType());
        assertEquals("/my-timetable", command.getValue().targetUrl());
        assertEquals("CLASS_SESSION:START:80", command.getValue().deduplicationKeyPrefix());
    }

    @Test
    void doesNotNotifyWhenOfflineClassStarts() {
        fixture(ClassType.OFFLINE);

        service.startClass(70L);

        verify(notificationService, never()).createForUsers(anyCollection(), any(NotificationCommand.class));
        verify(studentEnrollmentRepository, never())
                .findByAcademicYearAndGradeAndSectionAndActiveTrue(any(), any(), any());
    }

    private Fixture fixture(ClassType classType) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty", "test", List.of()));

        LocalDate today = LocalDate.now();
        User faculty = User.builder().id(10L).username("faculty")
                .fullName("Faculty One")
                .roles(Set.of(new Role(1L, RoleName.ROLE_FACULTY))).build();
        User student = User.builder().id(20L).fullName("Student One").build();
        AcademicYear year = AcademicYear.builder().id(30L).name("2026-2027").build();
        Grade grade = Grade.builder().id(40L).name("Grade 8").build();
        Section section = Section.builder().id(50L).name("A").build();
        Subject subject = Subject.builder().id(60L).name("Mathematics").code("MATH").build();
        Timetable timetable = Timetable.builder().id(70L).academicYear(year).grade(grade)
                .section(section).subject(subject).faculty(faculty)
                .classType(classType).active(true)
                .startDate(today.minusDays(1)).endDate(today.plusDays(1))
                .dayOfWeek(today.getDayOfWeek())
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                .meetingLink(classType == ClassType.ONLINE ? "https://meet.example/class" : null)
                .build();
        StudentEnrollment enrollment = StudentEnrollment.builder().id(90L).student(student)
                .academicYear(year).grade(grade).section(section).active(true).build();

        when(userRepository.findByUsername("faculty")).thenReturn(Optional.of(faculty));
        when(timetableRepository.findById(70L)).thenReturn(Optional.of(timetable));
        when(classSessionRepository.existsByTimetableAndSessionDate(timetable, today)).thenReturn(false);
        when(classSessionRepository.save(any(ClassSession.class))).thenAnswer(invocation -> {
            ClassSession session = invocation.getArgument(0);
            session.setId(80L);
            return session;
        });
        lenient().when(studentEnrollmentRepository.findByAcademicYearAndGradeAndSectionAndActiveTrue(year, grade, section))
                .thenReturn(List.of(enrollment));
        return new Fixture();
    }

    private record Fixture() {}
}
