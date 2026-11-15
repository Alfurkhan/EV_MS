package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceImplTest {

    @Mock private AttendanceRepository attendanceRepository;
    @Mock private ClassSessionRepository classSessionRepository;
    @Mock private StudentEnrollmentRepository studentEnrollmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private AttendanceServiceImpl service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void notifiesStudentAndCreatesOneAdminSummaryForNewAttendance() {
        Fixture fixture = fixture(null, AttendanceStatus.PRESENT, null);

        service.markAttendance(fixture.request());

        verify(notificationService).createForUsers(anyCollection(), any(NotificationCommand.class));
        verify(notificationService).createForUsersAndAdmins(anyCollection(), any(NotificationCommand.class));
    }

    @Test
    void notifiesWhenAttendanceStatusChanges() {
        Fixture fixture = fixture(
                Attendance.builder().id(700L).classSession(null).student(null)
                        .status(AttendanceStatus.PRESENT)
                        .createdAt(Instant.parse("2026-11-01T08:00:00Z"))
                        .updatedAt(Instant.parse("2026-11-01T08:00:00Z")).build(),
                AttendanceStatus.ABSENT,
                "Status corrected");

        service.markAttendance(fixture.request());

        verify(notificationService).createForUsers(anyCollection(), any(NotificationCommand.class));
        verify(notificationService).createForUsersAndAdmins(anyCollection(), any(NotificationCommand.class));
    }

    @Test
    void doesNotNotifyWhenOnlyRemarksChangeOrStatusIsUnchanged() {
        Fixture fixture = fixture(
                Attendance.builder().id(701L).status(AttendanceStatus.PRESENT)
                        .createdAt(Instant.parse("2026-11-01T08:00:00Z"))
                        .updatedAt(Instant.parse("2026-11-01T08:00:00Z")).build(),
                AttendanceStatus.PRESENT,
                "Updated remarks only");

        service.markAttendance(fixture.request());

        verify(notificationService, never()).createForUsers(anyCollection(), any(NotificationCommand.class));
        verify(notificationService, never()).createForUsersAndAdmins(anyCollection(), any(NotificationCommand.class));
    }

    private Fixture fixture(Attendance existing, AttendanceStatus requestedStatus, String remarks) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty", "test", List.of()));

        User faculty = User.builder().id(10L).username("faculty")
                .roles(Set.of(new Role(1L, RoleName.ROLE_FACULTY))).build();
        User student = User.builder().id(20L).fullName("Student One").build();
        AcademicYear year = AcademicYear.builder().id(30L).name("2026-2027").build();
        Grade grade = Grade.builder().id(40L).name("Grade 8").build();
        Section section = Section.builder().id(50L).name("A").build();
        Subject subject = Subject.builder().id(60L).name("Mathematics").build();
        Timetable timetable = Timetable.builder().id(70L).academicYear(year).grade(grade)
                .section(section).subject(subject).faculty(faculty).build();
        ClassSession session = ClassSession.builder().id(80L).timetable(timetable)
                .sessionDate(LocalDate.of(2026, 11, 6))
                .status(ClassSessionStatus.IN_PROGRESS).build();
        StudentEnrollment enrollment = StudentEnrollment.builder().id(90L).student(student)
                .academicYear(year).grade(grade).section(section).active(true).build();

        when(userRepository.findByUsername("faculty")).thenReturn(Optional.of(faculty));
        when(classSessionRepository.findById(80L)).thenReturn(Optional.of(session));
        when(studentEnrollmentRepository.findByAcademicYearAndGradeAndSectionAndActiveTrue(year, grade, section))
                .thenReturn(List.of(enrollment));
        when(attendanceRepository.findByClassSessionAndStudent(session, student))
                .thenReturn(Optional.ofNullable(existing));
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(invocation -> {
            Attendance saved = invocation.getArgument(0);
            if (saved.getId() == null) saved.setId(100L);
            saved.setClassSession(session);
            saved.setStudent(student);
            return saved;
        });
        when(attendanceRepository.findByClassSessionOrderByStudentFullNameAsc(session))
                .thenAnswer(invocation -> {
                    Attendance saved = existing;
                    if (saved == null) {
                        saved = Attendance.builder().id(100L).classSession(session).student(student)
                                .status(requestedStatus).createdAt(Instant.now()).updatedAt(Instant.now()).build();
                    } else {
                        saved.setClassSession(session);
                        saved.setStudent(student);
                        saved.setStatus(requestedStatus);
                    }
                    return List.of(saved);
                });

        AttendanceRequest item = new AttendanceRequest();
        item.setStudentId(student.getId());
        item.setStatus(requestedStatus);
        item.setRemarks(remarks);
        MarkAttendanceRequest request = new MarkAttendanceRequest();
        request.setClassSessionId(session.getId());
        request.setAttendance(List.of(item));
        return new Fixture(request);
    }

    private record Fixture(MarkAttendanceRequest request) {}
}
