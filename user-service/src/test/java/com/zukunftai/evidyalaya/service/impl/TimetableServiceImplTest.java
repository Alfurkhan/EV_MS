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

import java.time.DayOfWeek;
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
class TimetableServiceImplTest {

    @Mock private TimetableRepository timetableRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentEnrollmentRepository enrollmentRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private TimetableServiceImpl service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void notifiesAdminsWhenFacultySubmitsTimetableForApproval() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty", "test", List.of()));
        User faculty = User.builder().id(10L).username("faculty")
                .roles(Set.of(new Role(1L, RoleName.ROLE_FACULTY))).build();
        User admin = User.builder().id(20L).accountEnabled(true).accountDeleted(false)
                .roles(Set.of(new Role(2L, RoleName.ROLE_ADMIN))).build();
        AcademicYear year = AcademicYear.builder().id(30L).name("2026-2027").build();
        Grade grade = Grade.builder().id(40L).name("Grade 8").build();
        Section section = Section.builder().id(50L).name("A").build();
        Subject subject = Subject.builder().id(60L).name("Mathematics").build();
        Timetable timetable = Timetable.builder().id(70L).academicYear(year).grade(grade)
                .section(section).subject(subject).faculty(faculty)
                .dayOfWeek(DayOfWeek.MONDAY).startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0)).status(TimetableStatus.DRAFT)
                .active(false).updatedAt(java.time.Instant.parse("2026-11-01T08:00:00Z")).build();

        when(timetableRepository.findById(70L)).thenReturn(Optional.of(timetable));
        when(userRepository.findByUsername("faculty")).thenReturn(Optional.of(faculty));
        when(userRepository.findAll()).thenReturn(List.of(admin));
        when(timetableRepository.save(any(Timetable.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.submitTimetableForApproval(70L);

        ArgumentCaptor<NotificationCommand> command = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyCollection(), command.capture());
        assertEquals("TIMETABLE", command.getValue().sourceType());
        assertEquals("/timetable", command.getValue().targetUrl());
        assertEquals("Timetable awaiting approval", command.getValue().title());
        assertEquals(TimetableStatus.PENDING_APPROVAL, timetable.getStatus());
    }
}
