package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubjectServiceImplTest {

    @Mock private SubjectRepository subjectRepository;
    @Mock private UserRepository userRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private StudentEnrollmentRepository enrollmentRepository;
    @Mock private TimetableRepository timetableRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private SubjectServiceImpl service;

    @Test
    void notifiesFacultyWhenAssignedToSubject() {
        Subject subject = Subject.builder().id(1L).name("Mathematics").code("MATH")
                .faculties(new HashSet<>()).build();
        User faculty = User.builder().id(2L).fullName("Faculty One")
                .roles(Set.of(new Role(1L, RoleName.ROLE_FACULTY))).build();
        when(subjectRepository.findByIdWithFaculties(1L)).thenReturn(Optional.of(subject));
        when(userRepository.findById(2L)).thenReturn(Optional.of(faculty));

        service.assignFacultyToSubject(1L, 2L);

        ArgumentCaptor<NotificationCommand> command = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyCollection(), command.capture());
        assertEquals("SUBJECT", command.getValue().sourceType());
        assertEquals("/courses", command.getValue().targetUrl());
        assertEquals("Subject assigned", command.getValue().title());
    }

    @Test
    void notifiesActiveStudentsWhenSubjectIsAssignedToGrade() {
        Subject subject = Subject.builder().id(1L).name("Mathematics").code("MATH").build();
        Grade grade = Grade.builder().id(3L).name("Grade 8").subjects(new HashSet<>()).build();
        User student = User.builder().id(4L).fullName("Student One").build();
        StudentEnrollment enrollment = StudentEnrollment.builder().id(5L).student(student)
                .grade(grade).active(true).build();
        when(subjectRepository.findByIdWithFaculties(1L)).thenReturn(Optional.of(subject));
        when(gradeRepository.findById(3L)).thenReturn(Optional.of(grade));
        when(enrollmentRepository.findByGradeAndActiveTrue(grade)).thenReturn(List.of(enrollment));

        service.assignSubjectToGrade(1L, 3L);

        ArgumentCaptor<NotificationCommand> command = ArgumentCaptor.forClass(NotificationCommand.class);
        verify(notificationService).createForUsers(anyCollection(), command.capture());
        assertEquals("SUBJECT", command.getValue().sourceType());
        assertEquals("/my-subjects", command.getValue().targetUrl());
        assertEquals("New subject added", command.getValue().title());
    }
}
