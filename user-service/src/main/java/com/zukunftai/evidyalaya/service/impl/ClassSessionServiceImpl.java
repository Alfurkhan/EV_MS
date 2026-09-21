package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.ClassSession;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.ClassSessionResponse;
import com.zukunftai.evidyalaya.model.ClassSessionStatus;
import com.zukunftai.evidyalaya.model.FacultyMyClassResponse;
import com.zukunftai.evidyalaya.repository.ClassSessionRepository;
import com.zukunftai.evidyalaya.repository.TimetableRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.ClassSessionService;
import org.springframework.http.HttpStatus;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ClassSessionServiceImpl implements ClassSessionService {

    private final ClassSessionRepository classSessionRepository;
    private final TimetableRepository timetableRepository;
    private final UserRepository userRepository;

    public ClassSessionServiceImpl(
            ClassSessionRepository classSessionRepository,
            TimetableRepository timetableRepository,
            UserRepository userRepository
    ) {
        this.classSessionRepository = classSessionRepository;
        this.timetableRepository = timetableRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ClassSessionResponse startClass(Long timetableId) {

        User faculty = getCurrentFaculty();

        Timetable timetable = getTimetable(timetableId);

        validateFacultyOwnership(timetable, faculty);

        if (!timetable.isActive()) {
            throw new APIException(
                    "This timetable is disabled.",
                    BAD_REQUEST,
                    "TIMETABLE_DISABLED"
            );
        }

        LocalDate today = LocalDate.now();

        validateDateRange(timetable, today);
        validateScheduledDay(timetable, today);

        if (classSessionRepository
                .existsByTimetableAndSessionDate(timetable, today)) {

            ClassSession existingSession =
                    classSessionRepository
                            .findByTimetableAndSessionDate(
                                    timetable,
                                    today
                            )
                            .orElseThrow();

            throw new APIException(
                    "A class session already exists for this timetable today. Current status: "
                            + existingSession.getStatus(),
                    HttpStatus.CONFLICT,
                    "CLASS_SESSION_ALREADY_EXISTS"
            );
        }

        Instant now = Instant.now();

        ClassSession session = ClassSession.builder()
                .timetable(timetable)
                .sessionDate(today)
                .status(ClassSessionStatus.IN_PROGRESS)
                .startedAt(now)
                .endedAt(null)
                .durationMinutes(null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        ClassSession savedSession =
                classSessionRepository.save(session);

        return toResponse(savedSession);
    }

    @Override
    public ClassSessionResponse endClass(Long sessionId) {

        User faculty = getCurrentFaculty();

        ClassSession session =
                getClassSession(sessionId);

        Timetable timetable =
                session.getTimetable();

        validateFacultyOwnership(
                timetable,
                faculty
        );

        if (session.getStatus()
                != ClassSessionStatus.IN_PROGRESS) {

            throw new APIException(
                    "Only an in-progress class can be ended.",
                    HttpStatus.BAD_REQUEST,
                    "CLASS_SESSION_NOT_IN_PROGRESS"
            );
        }

        if (session.getStartedAt() == null) {

            throw new APIException(
                    "Class session start time is missing.",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "CLASS_SESSION_START_TIME_MISSING"
            );
        }

        Instant now = Instant.now();

        long durationSeconds =
                Duration.between(
                        session.getStartedAt(),
                        now
                ).getSeconds();

        int durationMinutes =
                (int) Math.max(
                        0,
                        durationSeconds / 60
                );

        session.setEndedAt(now);
        session.setDurationMinutes(durationMinutes);
        session.setStatus(ClassSessionStatus.COMPLETED);
        session.setUpdatedAt(now);

        ClassSession savedSession =
                classSessionRepository.save(session);

        return toResponse(savedSession);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassSessionResponse getSessionById(
            Long sessionId
    ) {

        ClassSession session =
                getClassSession(sessionId);

        return toResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getMySessions() {

        User faculty =
                getCurrentFaculty();

        List<Timetable> timetables =
                timetableRepository.findByFaculty(faculty);

        List<ClassSessionResponse> responses =
                new ArrayList<>();

        for (Timetable timetable : timetables) {

            List<ClassSession> sessions =
                    classSessionRepository
                            .findByTimetableOrderBySessionDateDesc(
                                    timetable
                            );

            for (ClassSession session : sessions) {
                responses.add(toResponse(session));
            }
        }

        responses.sort(
                Comparator.comparing(
                        ClassSessionResponse::getSessionDate,
                        Comparator.reverseOrder()
                )
        );

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getMySessionsByDate(
            LocalDate date
    ) {

        User faculty =
                getCurrentFaculty();

        List<Timetable> timetables =
                timetableRepository.findByFaculty(faculty);

        List<ClassSessionResponse> responses =
                new ArrayList<>();

        for (Timetable timetable : timetables) {

            List<ClassSession> sessions =
                    classSessionRepository
                            .findByTimetableOrderBySessionDateDesc(
                                    timetable
                            );

            for (ClassSession session : sessions) {

                if (session.getSessionDate()
                        .equals(date)) {

                    responses.add(
                            toResponse(session)
                    );
                }
            }
        }

        responses.sort(
                Comparator.comparing(
                        ClassSessionResponse::getStartedAt,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()
                        )
                )
        );

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getSessionsByDate(
            LocalDate date
    ) {

        return classSessionRepository
                .findBySessionDateOrderByStartedAtAsc(date)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getSessionsByTimetable(
            Long timetableId
    ) {

        Timetable timetable =
                getTimetable(timetableId);

        return classSessionRepository
                .findByTimetableOrderBySessionDateDesc(
                        timetable
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ClassSession getClassSession(
            Long sessionId
    ) {

        return classSessionRepository
                .findById(sessionId)
                .orElseThrow(() ->
                        new APIException(
                                "Class session not found.",
                                HttpStatus.NOT_FOUND,
                                "CLASS_SESSION_NOT_FOUND"
                        )
                );
    }

    private Timetable getTimetable(
            Long timetableId
    ) {

        return timetableRepository
                .findById(timetableId)
                .orElseThrow(() ->
                        new APIException(
                                "Timetable entry not found.",
                                HttpStatus.NOT_FOUND,
                                "TIMETABLE_NOT_FOUND"
                        )
                );
    }

    private User getCurrentFaculty() {

        String username =
                getCurrentUsername();

        User faculty =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new APIException(
                                        "Authenticated user not found.",
                                        HttpStatus.NOT_FOUND,
                                        "AUTHENTICATED_USER_NOT_FOUND"
                                )
                        );

        boolean isFaculty =
                faculty.getRoles() != null
                        && faculty.getRoles()
                        .stream()
                        .anyMatch(role ->
                                role.getName()
                                        == RoleName.ROLE_FACULTY
                        );

        if (!isFaculty) {

            throw new APIException(
                    "Authenticated user is not a Faculty member.",
                    HttpStatus.FORBIDDEN,
                    "USER_IS_NOT_FACULTY"
            );
        }

        return faculty;
    }

    private void validateFacultyOwnership(
            Timetable timetable,
            User faculty
    ) {

        if (timetable.getFaculty() == null
                || !timetable.getFaculty()
                .getId()
                .equals(faculty.getId())) {

            throw new APIException(
                    "You are not authorized to manage this class.",
                    HttpStatus.FORBIDDEN,
                    "FACULTY_TIMETABLE_ACCESS_DENIED"
            );
        }
    }

    private void validateDateRange(Timetable timetable, LocalDate date) {

        if (timetable.getStartDate() == null || timetable.getEndDate() == null) {
            throw new APIException(
                    "This timetable does not have a valid date range.",
                    BAD_REQUEST,
                    "INVALID_TIMETABLE_DATE_RANGE"
            );
        }

        if (date.isBefore(timetable.getStartDate())
                || date.isAfter(timetable.getEndDate())) {

            throw new APIException(
                    "This class is not active on today's date.",
                    BAD_REQUEST,
                    "CLASS_OUTSIDE_DATE_RANGE"
            );
        }
    }

    private void validateScheduledDay(
            Timetable timetable,
            LocalDate date
    ) {

        DayOfWeek scheduledDay =
                timetable.getDayOfWeek();

        if (scheduledDay == null) {

            throw new APIException(
                    "Timetable day is not configured.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_DAY_NOT_CONFIGURED"
            );
        }

        if (scheduledDay != date.getDayOfWeek()) {

            throw new APIException(
                    "This class is not scheduled for today.",
                    HttpStatus.BAD_REQUEST,
                    "CLASS_NOT_SCHEDULED_TODAY"
            );
        }
    }

    private ClassSessionResponse toResponse(
            ClassSession session
    ) {

        Timetable timetable =
                session.getTimetable();

        return ClassSessionResponse.builder()
                .id(session.getId())
                .timetableId(timetable.getId())

                .sessionDate(session.getSessionDate())
                .status(session.getStatus())

                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .durationMinutes(session.getDurationMinutes())

                .academicYearId(
                        timetable.getAcademicYear().getId()
                )
                .academicYearName(
                        timetable.getAcademicYear().getName()
                )

                .gradeId(
                        timetable.getGrade().getId()
                )
                .gradeName(
                        timetable.getGrade().getName()
                )

                .sectionId(
                        timetable.getSection().getId()
                )
                .sectionName(
                        timetable.getSection().getName()
                )

                .subjectId(
                        timetable.getSubject().getId()
                )
                .subjectName(
                        timetable.getSubject().getName()
                )
                .subjectCode(
                        timetable.getSubject().getCode()
                )

                .facultyId(
                        timetable.getFaculty().getId()
                )
                .facultyName(
                        timetable.getFaculty().getFullName()
                )
                .facultyEmail(
                        timetable.getFaculty().getEmail()
                )

                .scheduledStartTime(
                        timetable.getStartTime()
                )
                .scheduledEndTime(
                        timetable.getEndTime()
                )

                .room(
                        timetable.getRoom()
                )

                .build();
    }

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new APIException(
                    "User is not authenticated.",
                    HttpStatus.UNAUTHORIZED,
                    "USER_NOT_AUTHENTICATED"
            );
        }

        return authentication.getName();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyMyClassResponse> getMyClassesToday() {

        User faculty = getCurrentFaculty();

        LocalDate today = LocalDate.now();
        DayOfWeek todayOfWeek = today.getDayOfWeek();

        List<Timetable> timetables = timetableRepository
                .findByFacultyAndDayOfWeek(faculty, todayOfWeek)
                .stream()
                .filter(Timetable::isActive)
                .filter(timetable ->
                        timetable.getStartDate() != null
                                && timetable.getEndDate() != null
                                && !today.isBefore(timetable.getStartDate())
                                && !today.isAfter(timetable.getEndDate())
                )
                .sorted(Comparator.comparing(Timetable::getStartTime))
                .toList();

        List<FacultyMyClassResponse> responses = new ArrayList<>();

        for (Timetable timetable : timetables) {

            ClassSession session = classSessionRepository
                    .findByTimetableAndSessionDate(timetable, today)
                    .orElse(null);

            FacultyMyClassResponse.FacultyMyClassResponseBuilder response =
                    FacultyMyClassResponse.builder()
                            .timetableId(timetable.getId())
                            .sessionDate(today)

                            .academicYearId(timetable.getAcademicYear().getId())
                            .academicYearName(timetable.getAcademicYear().getName())

                            .gradeId(timetable.getGrade().getId())
                            .gradeName(timetable.getGrade().getName())

                            .sectionId(timetable.getSection().getId())
                            .sectionName(timetable.getSection().getName())

                            .subjectId(timetable.getSubject().getId())
                            .subjectName(timetable.getSubject().getName())
                            .subjectCode(timetable.getSubject().getCode())

                            .facultyId(timetable.getFaculty().getId())
                            .facultyName(timetable.getFaculty().getFullName())
                            .facultyEmail(timetable.getFaculty().getEmail())

                            .scheduledStartTime(timetable.getStartTime())
                            .scheduledEndTime(timetable.getEndTime())

                            .startDate(timetable.getStartDate())
                            .endDate(timetable.getEndDate())

                            .classType(timetable.getClassType())

                            .room(timetable.getRoom())
                            .meetingLink(timetable.getMeetingLink())
                            .notes(timetable.getNotes());

            if (session == null) {

                response
                        .status("NOT_STARTED")
                        .sessionId(null)
                        .startedAt(null)
                        .endedAt(null)
                        .durationMinutes(null);

            } else {

                response
                        .status(session.getStatus().name())
                        .sessionId(session.getId())
                        .startedAt(session.getStartedAt())
                        .endedAt(session.getEndedAt())
                        .durationMinutes(session.getDurationMinutes());
            }

            responses.add(response.build());
        }

        return responses;
    }
}