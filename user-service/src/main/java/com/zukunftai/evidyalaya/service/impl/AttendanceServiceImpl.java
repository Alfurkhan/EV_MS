package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Attendance;
import com.zukunftai.evidyalaya.database.ClassSession;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.AttendanceResponse;
import com.zukunftai.evidyalaya.model.MarkAttendanceRequest;
import com.zukunftai.evidyalaya.model.AttendanceRequest;
import com.zukunftai.evidyalaya.model.AttendanceStudentResponse;
import com.zukunftai.evidyalaya.model.ClassSessionStatus;
import com.zukunftai.evidyalaya.repository.AttendanceRepository;
import com.zukunftai.evidyalaya.repository.ClassSessionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zukunftai.evidyalaya.model.AttendanceChartPoint;
import com.zukunftai.evidyalaya.model.AttendanceDashboardResponse;
import com.zukunftai.evidyalaya.model.AttendanceStatus;
import com.zukunftai.evidyalaya.model.FacultyClassAttendancePoint;
import com.zukunftai.evidyalaya.model.FacultyClassAttendanceSummary;
import com.zukunftai.evidyalaya.model.FacultyWeeklyClassAttendanceResponse;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final UserRepository userRepository;

    public AttendanceServiceImpl(
            AttendanceRepository attendanceRepository,
            ClassSessionRepository classSessionRepository,
            StudentEnrollmentRepository studentEnrollmentRepository,
            UserRepository userRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceForSession(
            Long classSessionId
    ) {

        User faculty = getCurrentFaculty();

        ClassSession session =
                getClassSession(classSessionId);

        validateFacultyOwnership(
                session.getTimetable(),
                faculty
        );

        return attendanceRepository
                .findByClassSessionOrderByStudentFullNameAsc(session)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceStudentResponse> getStudentsForSession(
            Long classSessionId
    ) {
        User faculty = getCurrentFaculty();

        ClassSession session = getClassSession(classSessionId);

        Timetable timetable = session.getTimetable();

        validateFacultyOwnership(timetable, faculty);

        List<StudentEnrollment> eligibleEnrollments =
                studentEnrollmentRepository
                        .findByAcademicYearAndGradeAndSectionAndActiveTrue(
                                timetable.getAcademicYear(),
                                timetable.getGrade(),
                                timetable.getSection()
                        );

        Map<Long, Attendance> existingAttendance =
                attendanceRepository
                        .findByClassSessionOrderByStudentFullNameAsc(session)
                        .stream()
                        .collect(
                                java.util.stream.Collectors.toMap(
                                        attendance ->
                                                attendance.getStudent().getId(),
                                        attendance -> attendance
                                )
                        );

        return eligibleEnrollments
                .stream()
                .filter(enrollment ->
                        enrollment.getStudent() != null
                                && enrollment.getStudent().getId() != null
                )
                .map(enrollment -> {

                    User student = enrollment.getStudent();

                    Attendance attendance =
                            existingAttendance.get(student.getId());

                    return AttendanceStudentResponse.builder()
                            .studentId(student.getId())
                            .studentName(student.getFullName())
                            .studentEmail(student.getEmail())
                            .status(
                                    attendance != null
                                            ? attendance.getStatus()
                                            : null
                            )
                            .remarks(
                                    attendance != null
                                            ? attendance.getRemarks()
                                            : null
                            )
                            .build();
                })
                .toList();
    }

    @Override
    public List<AttendanceResponse> markAttendance(
            MarkAttendanceRequest request
    ) {

        User faculty = getCurrentFaculty();

        ClassSession session =
                getClassSession(request.getClassSessionId());

        Timetable timetable =
                session.getTimetable();

        validateFacultyOwnership(
                timetable,
                faculty
        );

        validateSessionForAttendance(session);

        List<StudentEnrollment> eligibleEnrollments =
                studentEnrollmentRepository
                        .findByAcademicYearAndGradeAndSectionAndActiveTrue(
                                timetable.getAcademicYear(),
                                timetable.getGrade(),
                                timetable.getSection()
                        );

        Map<Long, StudentEnrollment> eligibleStudents =
                new HashMap<>();

        for (StudentEnrollment enrollment : eligibleEnrollments) {

            if (enrollment.getStudent() != null
                    && enrollment.getStudent().getId() != null) {

                eligibleStudents.put(
                        enrollment.getStudent().getId(),
                        enrollment
                );
            }
        }

        validateAttendanceStudents(
                request,
                eligibleStudents
        );

        Instant now = Instant.now();

        for (AttendanceRequest item :
                request.getAttendance()) {

            User student =
                    eligibleStudents
                            .get(item.getStudentId())
                            .getStudent();

            Attendance attendance =
                    attendanceRepository
                            .findByClassSessionAndStudent(
                                    session,
                                    student
                            )
                            .orElseGet(() ->
                                    Attendance.builder()
                                            .classSession(session)
                                            .student(student)
                                            .createdAt(now)
                                            .build()
                            );

            attendance.setStatus(item.getStatus());
            attendance.setRemarks(item.getRemarks());
            attendance.setUpdatedAt(now);

            attendanceRepository.save(attendance);
        }

        return attendanceRepository
                .findByClassSessionOrderByStudentFullNameAsc(session)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance() {

        User student = getCurrentUser();

        return attendanceRepository
                .findByStudent(student)
                .stream()
                .sorted(
                        java.util.Comparator
                                .comparing(
                                        (Attendance attendance) ->
                                                attendance
                                                        .getClassSession()
                                                        .getSessionDate()
                                )
                                .reversed()
                )
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAdminAttendance() {

        LocalDate today = LocalDate.now();

        List<Attendance> attendance =
                attendanceRepository
                        .findByClassSessionSessionDateBetween(
                                LocalDate.of(2000, 1, 1),
                                today
                        );

        return attendance
                .stream()
                .sorted(
                        java.util.Comparator
                                .comparing(
                                        (Attendance record) ->
                                                record
                                                        .getClassSession()
                                                        .getSessionDate()
                                )
                                .reversed()
                )
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceDashboardResponse getDashboardAttendance() {

        User currentUser = getCurrentUser();

        boolean isStudent =
                currentUser.getRoles() != null
                        && currentUser.getRoles()
                        .stream()
                        .anyMatch(role ->
                                role.getName() == RoleName.ROLE_STUDENT
                        );

        boolean isFaculty =
                currentUser.getRoles() != null
                        && currentUser.getRoles()
                        .stream()
                        .anyMatch(role ->
                                role.getName() == RoleName.ROLE_FACULTY
                        );

        boolean isAdmin =
                currentUser.getRoles() != null
                        && currentUser.getRoles()
                        .stream()
                        .anyMatch(role ->
                                role.getName() == RoleName.ROLE_ADMIN
                        );

        if (!isStudent && !isFaculty && !isAdmin) {

            throw new APIException(
                    "User does not have a supported dashboard role.",
                    HttpStatus.FORBIDDEN,
                    "UNSUPPORTED_DASHBOARD_ROLE"
            );
        }

        LocalDate today = LocalDate.now();

        LocalDate weekStart =
                today.with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY
                        )
                );

        LocalDate weekEnd =
                weekStart.plusDays(5);

        List<Attendance> weeklyAttendance;

        if (isStudent) {

            weeklyAttendance =
                    attendanceRepository
                            .findByStudentIdAndClassSessionSessionDateBetween(
                                    currentUser.getId(),
                                    weekStart,
                                    weekEnd
                            );

        } else if (isFaculty) {

            weeklyAttendance =
                    attendanceRepository
                            .findByClassSessionTimetableFacultyIdAndClassSessionSessionDateBetween(
                                    currentUser.getId(),
                                    weekStart,
                                    weekEnd
                            );

        } else {

            weeklyAttendance =
                    attendanceRepository
                            .findByClassSessionSessionDateBetween(
                                    weekStart,
                                    weekEnd
                            );
        }

        List<Attendance> overallAttendance;

        if (isStudent) {

            overallAttendance =
                    attendanceRepository
                            .findByStudent(currentUser);

        } else if (isFaculty) {

            overallAttendance =
                    attendanceRepository
                            .findByClassSessionTimetableFacultyIdAndClassSessionSessionDateBetween(
                                    currentUser.getId(),
                                    LocalDate.of(2000, 1, 1),
                                    today
                            );

        } else {

            overallAttendance =
                    attendanceRepository
                            .findByClassSessionSessionDateBetween(
                                    LocalDate.of(2000, 1, 1),
                                    today
                            );
        }

        Double overallPercentage =
                calculateAttendancePercentage(
                        overallAttendance
                );

        Double todayPercentage =
                calculateAttendancePercentage(
                        weeklyAttendance
                                .stream()
                                .filter(attendance ->
                                        today.equals(
                                                attendance
                                                        .getClassSession()
                                                        .getSessionDate()
                                        )
                                )
                                .toList()
                );

        List<AttendanceChartPoint> chart =
                buildWeeklyChart(
                        weeklyAttendance
                );

        return AttendanceDashboardResponse.builder()
                .overallPercentage(overallPercentage)
                .todayPercentage(todayPercentage)
                .chart(chart)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyWeeklyClassAttendanceResponse
    getFacultyWeeklyClassAttendance() {

        User faculty = getCurrentFaculty();

        LocalDate today = LocalDate.now();

        LocalDate weekStart =
                today.with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY
                        )
                );

        LocalDate weekEnd =
                weekStart.plusDays(5);

        List<Attendance> weeklyAttendance =
                attendanceRepository
                        .findByClassSessionTimetableFacultyIdAndClassSessionSessionDateBetween(
                                faculty.getId(),
                                weekStart,
                                weekEnd
                        );

        List<FacultyClassAttendancePoint> dailyAttendance =
                buildFacultyClassAttendancePoints(
                        weeklyAttendance
                );

        Map<String, List<Attendance>> attendanceByClass =
                new HashMap<>();

        for (Attendance attendance : weeklyAttendance) {

            Timetable timetable =
                    attendance
                            .getClassSession()
                            .getTimetable();

            String classKey =
                    timetable.getSubject().getId()
                            + "-"
                            + timetable.getGrade().getId()
                            + "-"
                            + timetable.getSection().getId();

            attendanceByClass
                    .computeIfAbsent(
                            classKey,
                            key -> new ArrayList<>()
                    )
                    .add(attendance);
        }

        List<FacultyClassAttendanceSummary> classSummaries =
                attendanceByClass
                        .values()
                        .stream()
                        .map(this::toFacultyClassAttendanceSummary)
                        .toList();

        Double overallAverage =
                classSummaries.isEmpty()
                        ? null
                        : Math.round(
                        classSummaries
                                .stream()
                                .map(
                                        FacultyClassAttendanceSummary::getAttendance
                                )
                                .filter(
                                        java.util.Objects::nonNull
                                )
                                .mapToDouble(
                                        Double::doubleValue
                                )
                                .average()
                                .orElse(0.0)
                                * 100.0
                ) / 100.0;

        return FacultyWeeklyClassAttendanceResponse.builder()
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .dailyAttendance(dailyAttendance)
                .classSummaries(classSummaries)
                .overallAverage(overallAverage)
                .build();
    }

    private Double calculateAttendancePercentage(
            List<Attendance> attendance
    ) {

        if (attendance == null || attendance.isEmpty()) {
            return null;
        }

        long attended =
                attendance
                        .stream()
                        .filter(record ->
                                record.getStatus()
                                        == AttendanceStatus.PRESENT
                                        || record.getStatus()
                                        == AttendanceStatus.LATE
                        )
                        .count();

        return Math.round(
                (attended * 10000.0)
                        / attendance.size()
        ) / 100.0;
    }

    private List<AttendanceChartPoint> buildWeeklyChart(
            List<Attendance> weeklyAttendance
    ) {

        List<AttendanceChartPoint> chart =
                new ArrayList<>();

        LocalDate today = LocalDate.now();

        LocalDate weekStart =
                today.with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY
                        )
                );

        for (int i = 0; i < 6; i++) {

            LocalDate date =
                    weekStart.plusDays(i);

            List<Attendance> dailyAttendance =
                    weeklyAttendance
                            .stream()
                            .filter(attendance ->
                                    date.equals(
                                            attendance
                                                    .getClassSession()
                                                    .getSessionDate()
                                    )
                            )
                            .toList();

            chart.add(
                    AttendanceChartPoint.builder()
                            .day(
                                    date.getDayOfWeek()
                                            .getDisplayName(
                                                    java.time.format.TextStyle.SHORT,
                                                    java.util.Locale.ENGLISH
                                            )
                            )
                            .attendance(
                                    calculateAttendancePercentage(
                                            dailyAttendance
                                    )
                            )
                            .build()
            );
        }

        return chart;
    }

    private List<FacultyClassAttendancePoint>
    buildFacultyClassAttendancePoints(
            List<Attendance> weeklyAttendance
    ) {

        Map<Long, List<Attendance>> attendanceBySession =
                new HashMap<>();

        for (Attendance attendance : weeklyAttendance) {

            Long sessionId =
                    attendance
                            .getClassSession()
                            .getId();

            attendanceBySession
                    .computeIfAbsent(
                            sessionId,
                            key -> new ArrayList<>()
                    )
                    .add(attendance);
        }

        return attendanceBySession
                .values()
                .stream()
                .map(this::toFacultyClassAttendancePoint)
                .sorted(
                        java.util.Comparator
                                .comparing(
                                        FacultyClassAttendancePoint::getDate
                                )
                                .thenComparing(
                                        FacultyClassAttendancePoint::getSubjectName
                                )
                )
                .toList();
    }

    private FacultyClassAttendancePoint
    toFacultyClassAttendancePoint(
            List<Attendance> sessionAttendance
    ) {

        Attendance first =
                sessionAttendance.get(0);

        ClassSession session =
                first.getClassSession();

        Timetable timetable =
                session.getTimetable();

        return FacultyClassAttendancePoint.builder()
                .date(session.getSessionDate())

                .day(
                        session.getSessionDate()
                                .getDayOfWeek()
                                .getDisplayName(
                                        java.time.format.TextStyle.FULL,
                                        java.util.Locale.ENGLISH
                                )
                )

                .timetableId(timetable.getId())

                .subjectId(
                        timetable.getSubject().getId()
                )
                .subjectName(
                        timetable.getSubject().getName()
                )
                .subjectCode(
                        timetable.getSubject().getCode()
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

                .attendance(
                        calculateAttendancePercentage(
                                sessionAttendance
                        )
                )

                .build();
    }

    private FacultyClassAttendanceSummary
    toFacultyClassAttendanceSummary(
            List<Attendance> classAttendance
    ) {

        Attendance first =
                classAttendance.get(0);

        Timetable timetable =
                first
                        .getClassSession()
                        .getTimetable();

        return FacultyClassAttendanceSummary.builder()
                .subjectId(
                        timetable.getSubject().getId()
                )
                .subjectName(
                        timetable.getSubject().getName()
                )
                .subjectCode(
                        timetable.getSubject().getCode()
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

                .attendance(
                        calculateAttendancePercentage(
                                classAttendance
                        )
                )

                .build();
    }

    private void validateSessionForAttendance(
            ClassSession session
    ) {

        if (session.getStatus()
                != ClassSessionStatus.IN_PROGRESS) {

            throw new APIException(
                    "Attendance can only be marked while the class is in progress.",
                    HttpStatus.BAD_REQUEST,
                    "CLASS_SESSION_NOT_IN_PROGRESS"
            );
        }

        if (session.getTimetable() == null) {

            throw new APIException(
                    "Class session is not linked to a timetable.",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "CLASS_SESSION_TIMETABLE_MISSING"
            );
        }
    }

    private void validateAttendanceStudents(
            MarkAttendanceRequest request,
            Map<Long, StudentEnrollment> eligibleStudents
    ) {

        Set<Long> submittedStudentIds =
                new HashSet<>();

        for (AttendanceRequest item :
                request.getAttendance()) {

            if (item.getStudentId() == null) {

                throw new APIException(
                        "Student ID is required.",
                        HttpStatus.BAD_REQUEST,
                        "STUDENT_ID_REQUIRED"
                );
            }

            if (item.getStatus() == null) {

                throw new APIException(
                        "Attendance status is required.",
                        HttpStatus.BAD_REQUEST,
                        "ATTENDANCE_STATUS_REQUIRED"
                );
            }

            if (!submittedStudentIds.add(
                    item.getStudentId()
            )) {

                throw new APIException(
                        "Duplicate student found in attendance request.",
                        HttpStatus.BAD_REQUEST,
                        "DUPLICATE_STUDENT_ATTENDANCE"
                );
            }

            if (!eligibleStudents.containsKey(
                    item.getStudentId()
            )) {

                throw new APIException(
                        "Student is not actively enrolled in this class.",
                        HttpStatus.BAD_REQUEST,
                        "STUDENT_NOT_ELIGIBLE_FOR_CLASS"
                );
            }
        }
    }

    private ClassSession getClassSession(
            Long classSessionId
    ) {

        return classSessionRepository
                .findById(classSessionId)
                .orElseThrow(() ->
                        new APIException(
                                "Class session not found.",
                                HttpStatus.NOT_FOUND,
                                "CLASS_SESSION_NOT_FOUND"
                        )
                );
    }

    private User getCurrentUser() {

        String username =
                getCurrentUsername();

        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new APIException(
                                "Authenticated user not found.",
                                HttpStatus.NOT_FOUND,
                                "AUTHENTICATED_USER_NOT_FOUND"
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

        if (timetable == null
                || timetable.getFaculty() == null
                || !timetable.getFaculty()
                .getId()
                .equals(faculty.getId())) {

            throw new APIException(
                    "You are not authorized to manage attendance for this class.",
                    HttpStatus.FORBIDDEN,
                    "FACULTY_ATTENDANCE_ACCESS_DENIED"
            );
        }
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

    private AttendanceResponse toResponse(
            Attendance attendance
    ) {

        ClassSession session =
                attendance.getClassSession();

        Timetable timetable =
                session.getTimetable();

        User student =
                attendance.getStudent();

        User faculty =
                timetable.getFaculty();

        return AttendanceResponse.builder()
                .id(attendance.getId())

                .classSessionId(session.getId())
                .sessionDate(session.getSessionDate())

                .timetableId(timetable.getId())

                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())

                .facultyName(
                        faculty != null
                                ? faculty.getFullName()
                                : null
                )
                .facultyEmail(
                        faculty != null
                                ? faculty.getEmail()
                                : null
                )

                .subjectName(timetable.getSubject().getName())
                .subjectCode(timetable.getSubject().getCode())
                .gradeName(timetable.getGrade().getName())
                .sectionName(timetable.getSection().getName())

                .status(attendance.getStatus())
                .remarks(attendance.getRemarks())

                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())

                .build();
    }
}