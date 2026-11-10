package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.ClassType;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.TimetableStatus;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.database.MeetingPlatform;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.TimetableRequest;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.SectionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.SubjectRepository;
import com.zukunftai.evidyalaya.repository.TimetableRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.TimetableService;
import com.zukunftai.evidyalaya.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Objects;

import java.net.URI;
import java.net.URISyntaxException;

@Service
@Transactional
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;
    private final AcademicYearRepository academicYearRepository;
    private final GradeRepository gradeRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    public TimetableServiceImpl(
            TimetableRepository timetableRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            StudentEnrollmentRepository enrollmentRepository,
            NotificationService notificationService
    ) {
        this.timetableRepository = timetableRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.notificationService = notificationService;
    }

    @Override
    public Timetable createTimetable(TimetableRequest request) {

        AcademicYear academicYear =
                getAcademicYear(request.getAcademicYearId());

        Grade grade =
                getGrade(request.getGradeId());

        Section section =
                getSection(request.getSectionId());

        Subject subject =
                getSubject(request.getSubjectId());

        User faculty =
                getFaculty(request.getFacultyId());

        validateRelationships(
                academicYear,
                grade,
                section,
                subject,
                faculty
        );

        validateTime(request);

        validateDates(
                request,
                academicYear
        );

        validateClassType(request);

        MeetingPlatform meetingPlatform =
                detectMeetingPlatform(request);

        boolean active =
                request.getActive() == null
                        || request.getActive();

        if (active) {
            validateFacultyOverlap(
                    faculty,
                    request
            );

            validateSectionOverlap(
                    section,
                    request
            );

            validateSubjectFacultyConflict(
                    academicYear,
                    grade,
                    section,
                    subject,
                    faculty,
                    request
            );
        }

        Instant now = Instant.now();

        Timetable timetable =
                Timetable.builder()
                        .academicYear(academicYear)
                        .grade(grade)
                        .section(section)
                        .subject(subject)
                        .faculty(faculty)
                        .dayOfWeek(request.getDayOfWeek())
                        .startTime(request.getStartTime())
                        .endTime(request.getEndTime())
                        .classType(request.getClassType())
                        .meetingPlatform(meetingPlatform)
                        .startDate(request.getStartDate())
                        .endDate(request.getEndDate())
                        .room(normalizeOptional(request.getRoom()))
                        .meetingLink(normalizeOptional(request.getMeetingLink()))
                        .notes(normalizeOptional(request.getNotes()))
                        .active(active)
                        .status(TimetableStatus.APPROVED)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();

        Timetable saved = timetableRepository.save(timetable);
        if (saved.isActive() && currentUserIsAdmin()) {
            String eventKey = "TIMETABLE:" + saved.getId() + ":CREATED:" + saved.getUpdatedAt().toEpochMilli();
            notifyTimetableRecipients(saved, "Timetable published", "Timetable published",
                    timetableMessage(saved, "A new approved timetable has been published."),
                    timetableMessage(saved, "A new class has been added to your timetable."),
                    eventKey);
        }
        return saved;
    }

    @Override
    public Timetable createFacultyDraft(TimetableRequest request) {
        User faculty = getCurrentFaculty();
        request.setFacultyId(faculty.getId());
        request.setActive(false);
        Timetable timetable = createTimetable(request);
        timetable.setStatus(TimetableStatus.DRAFT);
        timetable.setActive(false);
        timetable.setUpdatedAt(Instant.now());
        return timetableRepository.save(timetable);
    }

    public Timetable updateFacultyDraft(Long id, TimetableRequest request) {
        Timetable existing = getTimetableById(id);
        User faculty = getCurrentFaculty();
        if (!existing.getFaculty().getId().equals(faculty.getId())) {
            throw new APIException("You can only edit your own timetable.", HttpStatus.FORBIDDEN, "TIMETABLE_NOT_OWNED");
        }
        if (existing.getStatus() != TimetableStatus.DRAFT && existing.getStatus() != TimetableStatus.REJECTED) {
            throw new APIException("Only draft or rejected timetables can be edited.", HttpStatus.CONFLICT, "TIMETABLE_NOT_EDITABLE");
        }
        request.setFacultyId(faculty.getId());
        request.setActive(false);
        Timetable updated = updateTimetableInternal(id, request);
        updated.setStatus(TimetableStatus.DRAFT);
        updated.setActive(false);
        updated.setUpdatedAt(Instant.now());
        return timetableRepository.save(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getMyTimetableDrafts() {
        return timetableRepository.findByFacultyAndStatusInOrderByCreatedAtDesc(
                getCurrentFaculty(), List.of(TimetableStatus.DRAFT, TimetableStatus.REJECTED)
        );
    }

    @Override
    public Timetable submitTimetableForApproval(Long id) {
        Timetable timetable = getTimetableById(id);
        User faculty = getCurrentFaculty();
        if (!timetable.getFaculty().getId().equals(faculty.getId())) {
            throw new APIException("You can only submit your own timetable.", HttpStatus.FORBIDDEN, "TIMETABLE_NOT_OWNED");
        }
        if (timetable.getStatus() != TimetableStatus.DRAFT && timetable.getStatus() != TimetableStatus.REJECTED) {
            throw new APIException("Only draft or rejected timetables can be submitted.", HttpStatus.CONFLICT, "TIMETABLE_NOT_SUBMITTABLE");
        }
        timetable.setStatus(TimetableStatus.PENDING_APPROVAL);
        timetable.setActive(false);
        timetable.setUpdatedAt(Instant.now());
        Timetable submitted = timetableRepository.save(timetable);
        notificationService.createForUsers(
                activeAdminsExcludingCurrentActor(),
                new NotificationCommand(
                        "TIMETABLE", submitted.getId(), "Timetable awaiting approval",
                        timetableMessage(submitted, "A faculty member submitted a timetable for approval."),
                        "TIMETABLES", "NORMAL", "/timetable",
                        "TIMETABLE:" + submitted.getId() + ":SUBMITTED:" + submitted.getUpdatedAt().toEpochMilli()
                )
        );
        return submitted;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getPendingTimetableApprovals() {
        return timetableRepository.findByStatusOrderByCreatedAtDesc(TimetableStatus.PENDING_APPROVAL);
    }

    @Override
    public Timetable approveTimetable(Long id) {
        Timetable timetable = getTimetableById(id);
        if (timetable.getStatus() != TimetableStatus.PENDING_APPROVAL) {
            throw new APIException("Only pending timetables can be approved.", HttpStatus.CONFLICT, "TIMETABLE_NOT_PENDING");
        }
        TimetableRequest request = new TimetableRequest();
        request.setAcademicYearId(timetable.getAcademicYear().getId());
        request.setGradeId(timetable.getGrade().getId());
        request.setSectionId(timetable.getSection().getId());
        request.setSubjectId(timetable.getSubject().getId());
        request.setFacultyId(timetable.getFaculty().getId());
        request.setDayOfWeek(timetable.getDayOfWeek());
        request.setStartTime(timetable.getStartTime());
        request.setEndTime(timetable.getEndTime());
        request.setClassType(timetable.getClassType());
        request.setStartDate(timetable.getStartDate());
        request.setEndDate(timetable.getEndDate());
        request.setRoom(timetable.getRoom());
        request.setMeetingLink(timetable.getMeetingLink());
        request.setNotes(timetable.getNotes());
        validateFacultyOverlapForUpdate(timetable.getFaculty(), request, id);
        validateSectionOverlapForUpdate(timetable.getSection(), request, id);
        validateSubjectFacultyConflictForUpdate(timetable.getAcademicYear(), timetable.getGrade(), timetable.getSection(), timetable.getSubject(), timetable.getFaculty(), request, id);
        timetable.setStatus(TimetableStatus.APPROVED);
        timetable.setActive(true);
        timetable.setUpdatedAt(Instant.now());
        Timetable approved = timetableRepository.save(timetable);
        String eventKey = "TIMETABLE:" + approved.getId() + ":APPROVED:" + approved.getUpdatedAt().toEpochMilli();
        notifyTimetableRecipients(approved, "Timetable approved", "Timetable approved",
                timetableMessage(approved, "Your timetable request has been approved."),
                timetableMessage(approved, "A new approved class has been added to your timetable."),
                eventKey);
        return approved;
    }

    @Override
    public Timetable rejectTimetable(Long id, String reason) {
        Timetable timetable = getTimetableById(id);
        if (timetable.getStatus() != TimetableStatus.PENDING_APPROVAL) {
            throw new APIException("Only pending timetables can be rejected.", HttpStatus.CONFLICT, "TIMETABLE_NOT_PENDING");
        }
        String normalizedReason = normalizeOptional(reason);
        if (normalizedReason == null) {
            throw new APIException("A rejection reason is required.", HttpStatus.BAD_REQUEST, "REJECTION_REASON_REQUIRED");
        }
        timetable.setNotes((timetable.getNotes() == null ? "" : timetable.getNotes() + "\n") + "Rejection reason: " + normalizedReason);
        timetable.setStatus(TimetableStatus.REJECTED);
        timetable.setActive(false);
        timetable.setUpdatedAt(Instant.now());
        Timetable rejected = timetableRepository.save(timetable);
        notificationService.createForUsers(
                withoutCurrentActor(List.of(rejected.getFaculty())),
                new NotificationCommand(
                        "TIMETABLE", rejected.getId(), "Timetable request rejected",
                        "Your timetable request was rejected. Reason: " + normalizedReason,
                        "TIMETABLES", "IMPORTANT", "/my-classes",
                        "TIMETABLE:" + rejected.getId() + ":REJECTED:" + rejected.getUpdatedAt().toEpochMilli()
                )
        );
        return rejected;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getAllTimetables() {

        return timetableRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Timetable getTimetableById(Long id) {

        return timetableRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Timetable entry not found.",
                                HttpStatus.NOT_FOUND,
                                "TIMETABLE_NOT_FOUND"
                        )
                );
    }

    @Override
    public Timetable updateTimetable(
            Long id,
            TimetableRequest request
    ) {
        Timetable existing = getTimetableById(id);
        if (existing.getStatus() != TimetableStatus.APPROVED) {
            throw new APIException(
                    "Only approved timetables can be edited here. Faculty drafts must be edited through the draft workflow.",
                    HttpStatus.CONFLICT,
                    "TIMETABLE_NOT_APPROVED"
            );
        }
        TimetableSnapshot before = TimetableSnapshot.from(existing);
        Timetable updated = updateTimetableInternal(id, request);
        if (before.hasMeaningfulChanges(updated)) {
            String eventKey = "TIMETABLE:" + updated.getId() + ":UPDATED:" + updated.getUpdatedAt().toEpochMilli();
            notifyTimetableSnapshotChanges(before, updated, eventKey);
        }
        return updated;
    }

    private Timetable updateTimetableInternal(
            Long id,
            TimetableRequest request
    ) {

        Timetable timetable =
                getTimetableById(id);

        AcademicYear academicYear =
                getAcademicYear(request.getAcademicYearId());

        Grade grade =
                getGrade(request.getGradeId());

        Section section =
                getSection(request.getSectionId());

        Subject subject =
                getSubject(request.getSubjectId());

        User faculty =
                getFaculty(request.getFacultyId());

        validateRelationships(
                academicYear,
                grade,
                section,
                subject,
                faculty
        );

        validateTime(request);

        validateDates(
                request,
                academicYear
        );

        validateClassType(request);

        MeetingPlatform meetingPlatform =
                detectMeetingPlatform(request);

        boolean active =
                request.getActive() == null
                        ? timetable.isActive()
                        : request.getActive();

        if (active) {

            validateFacultyOverlapForUpdate(
                    faculty,
                    request,
                    id
            );

            validateSectionOverlapForUpdate(
                    section,
                    request,
                    id
            );

            validateSubjectFacultyConflictForUpdate(
                    academicYear,
                    grade,
                    section,
                    subject,
                    faculty,
                    request,
                    id
            );
        }

        timetable.setAcademicYear(academicYear);
        timetable.setGrade(grade);
        timetable.setSection(section);
        timetable.setSubject(subject);
        timetable.setFaculty(faculty);
        timetable.setDayOfWeek(request.getDayOfWeek());
        timetable.setStartTime(request.getStartTime());
        timetable.setEndTime(request.getEndTime());
        timetable.setClassType(request.getClassType());
        timetable.setMeetingPlatform(meetingPlatform);
        timetable.setStartDate(request.getStartDate());
        timetable.setEndDate(request.getEndDate());
        timetable.setRoom(
                normalizeOptional(request.getRoom())
        );
        timetable.setMeetingLink(
                normalizeOptional(request.getMeetingLink())
        );
        timetable.setNotes(
                normalizeOptional(request.getNotes())
        );
        timetable.setActive(active);
        timetable.setUpdatedAt(Instant.now());

        return timetableRepository.save(timetable);
    }

    @Override
    public void deleteTimetable(Long id) {

        Timetable timetable = getTimetableById(id);
        String eventKey = "TIMETABLE:" + timetable.getId() + ":DELETED:" + Instant.now().toEpochMilli();
        notifyTimetableRecipients(timetable, "Timetable removed", "Timetable removed",
                timetableMessage(timetable, "Your timetable entry has been removed."),
                timetableMessage(timetable, "A class has been removed from your timetable."),
                eventKey);
        timetableRepository.delete(timetable);
    }

    @Override
    public void disableTimetable(Long id) {

        Timetable timetable =
                getTimetableById(id);

        if (!timetable.isActive()) {

            throw new APIException(
                    "Timetable is already disabled.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_ALREADY_DISABLED"
            );
        }

        timetable.setActive(false);
        timetable.setUpdatedAt(Instant.now());

        Timetable disabled = timetableRepository.save(timetable);
        String eventKey = "TIMETABLE:" + disabled.getId() + ":DISABLED:" + disabled.getUpdatedAt().toEpochMilli();
        notifyTimetableRecipients(disabled, "Timetable disabled", "Timetable disabled",
                timetableMessage(disabled, "This timetable entry has been disabled."),
                timetableMessage(disabled, "A class in your timetable has been disabled."),
                eventKey);
    }

    @Override
    public void enableTimetable(Long id) {

        Timetable timetable =
                getTimetableById(id);

        if (timetable.getStatus() != TimetableStatus.APPROVED) {
            throw new APIException(
                    "Only approved timetables can be enabled.",
                    HttpStatus.CONFLICT,
                    "TIMETABLE_NOT_APPROVED"
            );
        }

        if (timetable.isActive()) {

            throw new APIException(
                    "Timetable is already enabled.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_ALREADY_ENABLED"
            );
        }

        LocalDate today = LocalDate.now();

        if (timetable.getEndDate().isBefore(today)) {

            throw new APIException(
                    "This timetable has already expired and cannot be enabled.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_EXPIRED"
            );
        }

        TimetableRequest request =
                new TimetableRequest();

        request.setDayOfWeek(
                timetable.getDayOfWeek()
        );
        request.setStartTime(
                timetable.getStartTime()
        );
        request.setEndTime(
                timetable.getEndTime()
        );
        request.setStartDate(
                timetable.getStartDate()
        );
        request.setEndDate(
                timetable.getEndDate()
        );

        validateFacultyOverlap(
                timetable.getFaculty(),
                request
        );

        validateSectionOverlap(
                timetable.getSection(),
                request
        );

        validateSubjectFacultyConflict(
                timetable.getAcademicYear(),
                timetable.getGrade(),
                timetable.getSection(),
                timetable.getSubject(),
                timetable.getFaculty(),
                request
        );

        timetable.setActive(true);
        timetable.setUpdatedAt(Instant.now());

        Timetable enabled = timetableRepository.save(timetable);
        String eventKey = "TIMETABLE:" + enabled.getId() + ":ENABLED:" + enabled.getUpdatedAt().toEpochMilli();
        notifyTimetableRecipients(enabled, "Timetable enabled", "Timetable enabled",
                timetableMessage(enabled, "This timetable entry has been enabled."),
                timetableMessage(enabled, "A class has been added back to your timetable."),
                eventKey);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getTimetablesByAcademicYear(
            Long academicYearId
    ) {

        AcademicYear academicYear =
                getAcademicYear(academicYearId);

        return timetableRepository
                .findByAcademicYear(academicYear);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getTimetablesByGrade(
            Long gradeId
    ) {

        Grade grade =
                getGrade(gradeId);

        return timetableRepository
                .findByGrade(grade);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getTimetablesBySection(
            Long sectionId
    ) {

        Section section =
                getSection(sectionId);

        return timetableRepository
                .findBySection(section);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getTimetablesByFaculty(
            Long facultyId
    ) {

        User faculty =
                getFaculty(facultyId);

        return timetableRepository
                .findByFaculty(faculty);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getMyAssignmentClasses() {
        User faculty = getCurrentFaculty();

        return timetableRepository.findByFaculty(faculty).stream()
                .filter(entry -> entry.isActive()
                        && entry.getStatus() == TimetableStatus.APPROVED)
                .sorted(Comparator.comparing(
                                (Timetable entry) -> entry.getAcademicYear().getId())
                        .thenComparing(entry -> entry.getGrade().getName())
                        .thenComparing(entry -> entry.getSection().getName()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getMyTimetable() {

        User faculty =
                getCurrentFaculty();

        LocalDate today =
                LocalDate.now();

        return timetableRepository
                .findByFacultyAndActiveTrueAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        faculty,
                        TimetableStatus.APPROVED,
                        today,
                        today
                )
                .stream()
                .sorted(
                        Comparator
                                .comparing(Timetable::getDayOfWeek)
                                .thenComparing(Timetable::getStartTime)
                )
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Timetable> getMyStudentTimetable() {

        User student =
                getCurrentStudent();

        AcademicYear activeAcademicYear =
                academicYearRepository
                        .findByActiveTrue()
                        .orElseThrow(() ->
                                new APIException(
                                        "No active academic year is configured.",
                                        HttpStatus.NOT_FOUND,
                                        "ACTIVE_ACADEMIC_YEAR_NOT_FOUND"
                                )
                        );

        StudentEnrollment enrollment =
                enrollmentRepository
                        .findByStudentAndAcademicYearAndActiveTrue(
                                student,
                                activeAcademicYear
                        )
                        .orElseThrow(() ->
                                new APIException(
                                        "No active enrollment found for the current academic year.",
                                        HttpStatus.NOT_FOUND,
                                        "ACTIVE_STUDENT_ENROLLMENT_NOT_FOUND"
                                )
                        );

        return timetableRepository
                .findByAcademicYearAndGradeAndSectionAndActiveTrueAndStatus(
                        activeAcademicYear,
                        enrollment.getGrade(),
                        enrollment.getSection(),
                        TimetableStatus.APPROVED
                )
                .stream()
                .sorted(
                        Comparator
                                .comparing(Timetable::getDayOfWeek)
                                .thenComparing(Timetable::getStartTime)
                )
                .toList();
    }

    private AcademicYear getAcademicYear(
            Long id
    ) {

        return academicYearRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Academic year not found.",
                                HttpStatus.NOT_FOUND,
                                "ACADEMIC_YEAR_NOT_FOUND"
                        )
                );
    }

    private Grade getGrade(
            Long id
    ) {

        return gradeRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Grade not found.",
                                HttpStatus.NOT_FOUND,
                                "GRADE_NOT_FOUND"
                        )
                );
    }

    private Section getSection(
            Long id
    ) {

        return sectionRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Section not found.",
                                HttpStatus.NOT_FOUND,
                                "SECTION_NOT_FOUND"
                        )
                );
    }

    private Subject getSubject(
            Long id
    ) {

        return subjectRepository.findById(id)
                .orElseThrow(() ->
                        new APIException(
                                "Subject not found.",
                                HttpStatus.NOT_FOUND,
                                "SUBJECT_NOT_FOUND"
                        )
                );
    }

    private User getFaculty(
            Long id
    ) {

        User faculty =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new APIException(
                                        "Faculty not found.",
                                        HttpStatus.NOT_FOUND,
                                        "FACULTY_NOT_FOUND"
                                )
                        );

        boolean isFaculty =
                faculty.getRoles() != null &&
                        faculty.getRoles()
                                .stream()
                                .anyMatch(role ->
                                        role.getName()
                                                == RoleName.ROLE_FACULTY
                                );

        if (!isFaculty) {

            throw new APIException(
                    "The selected user is not a Faculty member.",
                    HttpStatus.BAD_REQUEST,
                    "USER_IS_NOT_FACULTY"
            );
        }

        return faculty;
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
                faculty.getRoles() != null &&
                        faculty.getRoles()
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

    private User getCurrentStudent() {

        String username =
                getCurrentUsername();

        User student =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new APIException(
                                        "Authenticated user not found.",
                                        HttpStatus.NOT_FOUND,
                                        "AUTHENTICATED_USER_NOT_FOUND"
                                )
                        );

        boolean isStudent =
                student.getRoles() != null &&
                        student.getRoles()
                                .stream()
                                .anyMatch(role ->
                                        role.getName()
                                                == RoleName.ROLE_STUDENT
                                );

        if (!isStudent) {

            throw new APIException(
                    "Authenticated user is not a Student.",
                    HttpStatus.FORBIDDEN,
                    "USER_IS_NOT_STUDENT"
            );
        }

        return student;
    }

    private void validateRelationships(
            AcademicYear academicYear,
            Grade grade,
            Section section,
            Subject subject,
            User faculty
    ) {

        if (!grade.getAcademicYear()
                .getId()
                .equals(academicYear.getId())) {

            throw new APIException(
                    "The selected Grade does not belong to the selected Academic Year.",
                    HttpStatus.BAD_REQUEST,
                    "GRADE_ACADEMIC_YEAR_MISMATCH"
            );
        }

        if (!section.getGrade()
                .getId()
                .equals(grade.getId())) {

            throw new APIException(
                    "The selected Section does not belong to the selected Grade.",
                    HttpStatus.BAD_REQUEST,
                    "SECTION_GRADE_MISMATCH"
            );
        }

        boolean subjectAssignedToGrade =
                grade.getSubjects() != null &&
                        grade.getSubjects()
                                .stream()
                                .anyMatch(existingSubject ->
                                        existingSubject.getId()
                                                .equals(subject.getId())
                                );

        if (!subjectAssignedToGrade) {

            throw new APIException(
                    "The selected Subject is not assigned to the selected Grade.",
                    HttpStatus.BAD_REQUEST,
                    "SUBJECT_GRADE_MISMATCH"
            );
        }

        boolean facultyAssignedToSubject =
                subject.getFaculties() != null &&
                        subject.getFaculties()
                                .stream()
                                .anyMatch(existingFaculty ->
                                        existingFaculty.getId()
                                                .equals(faculty.getId())
                                );

        if (!facultyAssignedToSubject) {

            throw new APIException(
                    "The selected Faculty is not assigned to the selected Subject.",
                    HttpStatus.BAD_REQUEST,
                    "FACULTY_SUBJECT_MISMATCH"
            );
        }
    }

    private void validateTime(
            TimetableRequest request
    ) {

        if (request.getStartTime() == null ||
                request.getEndTime() == null) {

            throw new APIException(
                    "Start time and end time are required.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_TIME_REQUIRED"
            );
        }

        if (!request.getStartTime()
                .isBefore(request.getEndTime())) {

            throw new APIException(
                    "End time must be after start time.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TIMETABLE_TIME"
            );
        }

        if (request.getDayOfWeek() == null) {

            throw new APIException(
                    "Day of week is required.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_DAY_REQUIRED"
            );
        }
    }

    private void validateDates(
            TimetableRequest request,
            AcademicYear academicYear
    ) {

        if (request.getStartDate() == null ||
                request.getEndDate() == null) {

            throw new APIException(
                    "Start date and end date are required.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_DATE_REQUIRED"
            );
        }

        if (request.getEndDate()
                .isBefore(request.getStartDate())) {

            throw new APIException(
                    "End date must be on or after start date.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TIMETABLE_DATE_RANGE"
            );
        }

        if (request.getStartDate()
                .isBefore(academicYear.getStartDate())) {

            throw new APIException(
                    "Timetable start date cannot be before the Academic Year start date.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_START_DATE_OUTSIDE_ACADEMIC_YEAR"
            );
        }

        if (request.getEndDate()
                .isAfter(academicYear.getEndDate())) {

            throw new APIException(
                    "Timetable end date cannot be after the Academic Year end date.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_END_DATE_OUTSIDE_ACADEMIC_YEAR"
            );
        }
    }

    private void validateClassType(
            TimetableRequest request
    ) {

        if (request.getClassType() == null) {

            throw new APIException(
                    "Class type is required.",
                    HttpStatus.BAD_REQUEST,
                    "TIMETABLE_CLASS_TYPE_REQUIRED"
            );
        }

        String room =
                normalizeOptional(request.getRoom());

        String meetingLink =
                normalizeOptional(request.getMeetingLink());

        if (request.getClassType() == ClassType.OFFLINE) {

            if (room == null) {

                throw new APIException(
                        "Room is required for an offline class.",
                        HttpStatus.BAD_REQUEST,
                        "OFFLINE_ROOM_REQUIRED"
                );
            }

            if (meetingLink != null) {

                throw new APIException(
                        "Meeting link should not be provided for an offline class.",
                        HttpStatus.BAD_REQUEST,
                        "OFFLINE_MEETING_LINK_NOT_ALLOWED"
                );
            }
        }

        if (request.getClassType() == ClassType.ONLINE) {

            if (meetingLink == null) {

                throw new APIException(
                        "Meeting link is required for an online class.",
                        HttpStatus.BAD_REQUEST,
                        "ONLINE_MEETING_LINK_REQUIRED"
                );
            }

            if (room != null) {

                throw new APIException(
                        "Room should not be provided for an online class.",
                        HttpStatus.BAD_REQUEST,
                        "ONLINE_ROOM_NOT_ALLOWED"
                );
            }
        }
    }

    private void validateFacultyOverlap(
            User faculty,
            TimetableRequest request
    ) {

        if (timetableRepository.existsFacultyOverlap(
                faculty,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getStartDate(),
                request.getEndDate()
        )) {

            throw new APIException(
                    "The Faculty already has another timetable entry during this time and recurring period.",
                    HttpStatus.CONFLICT,
                    "FACULTY_TIMETABLE_OVERLAP"
            );
        }
    }

    private void validateSectionOverlap(
            Section section,
            TimetableRequest request
    ) {

        if (timetableRepository.existsSectionOverlap(
                section,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getStartDate(),
                request.getEndDate()
        )) {

            throw new APIException(
                    "The Section already has another timetable entry during this time and recurring period.",
                    HttpStatus.CONFLICT,
                    "SECTION_TIMETABLE_OVERLAP"
            );
        }
    }

    private void validateFacultyOverlapForUpdate(
            User faculty,
            TimetableRequest request,
            Long id
    ) {

        if (timetableRepository.existsFacultyOverlapForUpdate(
                faculty,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getStartDate(),
                request.getEndDate(),
                id
        )) {

            throw new APIException(
                    "The Faculty already has another timetable entry during this time and recurring period.",
                    HttpStatus.CONFLICT,
                    "FACULTY_TIMETABLE_OVERLAP"
            );
        }
    }

    private void validateSectionOverlapForUpdate(
            Section section,
            TimetableRequest request,
            Long id
    ) {

        if (timetableRepository.existsSectionOverlapForUpdate(
                section,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getStartDate(),
                request.getEndDate(),
                id
        )) {

            throw new APIException(
                    "The Section already has another timetable entry during this time and recurring period.",
                    HttpStatus.CONFLICT,
                    "SECTION_TIMETABLE_OVERLAP"
            );
        }
    }

    private void validateSubjectFacultyConflict(
            AcademicYear academicYear,
            Grade grade,
            Section section,
            Subject subject,
            User faculty,
            TimetableRequest request
    ) {

        if (timetableRepository.existsSubjectWithDifferentFaculty(
                academicYear,
                grade,
                section,
                subject,
                faculty,
                request.getStartDate(),
                request.getEndDate()
        )) {

            throw new APIException(
                    "This Subject is already assigned to a different Faculty for this Grade and Section during the selected recurring period.",
                    HttpStatus.CONFLICT,
                    "SUBJECT_DIFFERENT_FACULTY_CONFLICT"
            );
        }
    }

    private void validateSubjectFacultyConflictForUpdate(
            AcademicYear academicYear,
            Grade grade,
            Section section,
            Subject subject,
            User faculty,
            TimetableRequest request,
            Long id
    ) {

        if (timetableRepository.existsSubjectWithDifferentFacultyForUpdate(
                academicYear,
                grade,
                section,
                subject,
                faculty,
                request.getStartDate(),
                request.getEndDate(),
                id
        )) {

            throw new APIException(
                    "This Subject is already assigned to a different Faculty for this Grade and Section during the selected recurring period.",
                    HttpStatus.CONFLICT,
                    "SUBJECT_DIFFERENT_FACULTY_CONFLICT"
            );
        }
    }

    private MeetingPlatform detectMeetingPlatform(
            TimetableRequest request
    ) {

        if (request.getClassType() == ClassType.OFFLINE) {
            return null;
        }

        String meetingLink =
                normalizeOptional(request.getMeetingLink());

        if (meetingLink == null) {

            throw new APIException(
                    "Meeting link is required for an online class.",
                    HttpStatus.BAD_REQUEST,
                    "ONLINE_MEETING_LINK_REQUIRED"
            );
        }

        try {

            URI uri =
                    new URI(meetingLink);

            String host =
                    uri.getHost();

            if (host == null) {

                throw new APIException(
                        "Invalid meeting link.",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_MEETING_LINK"
                );
            }

            String normalizedHost =
                    host.toLowerCase();

            if (
                    normalizedHost.equals("meet.google.com")
                            || normalizedHost.endsWith(".meet.google.com")
            ) {
                return MeetingPlatform.GOOGLE_MEET;
            }

            if (
                    normalizedHost.equals("zoom.us")
                            || normalizedHost.endsWith(".zoom.us")
            ) {
                return MeetingPlatform.ZOOM;
            }

            if (
                    normalizedHost.equals("teams.microsoft.com")
                            || normalizedHost.endsWith(".teams.microsoft.com")
            ) {
                return MeetingPlatform.MICROSOFT_TEAMS;
            }

            throw new APIException(
                    "Unsupported online meeting platform. Supported platforms are Google Meet, Zoom, and Microsoft Teams.",
                    HttpStatus.BAD_REQUEST,
                    "UNSUPPORTED_MEETING_PLATFORM"
            );

        } catch (URISyntaxException exception) {

            throw new APIException(
                    "Invalid meeting link.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MEETING_LINK"
            );
        }
    }


    private void notifyTimetableRecipients(Timetable timetable,
            String facultyTitle, String studentTitle,
            String facultyMessage, String studentMessage, String eventKey) {
        if (timetable.getFaculty() != null) {
            notificationService.createForUsers(withoutCurrentActor(List.of(timetable.getFaculty())),
                    new NotificationCommand("TIMETABLE", timetable.getId(), facultyTitle, facultyMessage,
                            "TIMETABLES", "NORMAL", "/my-classes", eventKey + ":FACULTY", true));
        }
        List<User> students = activeStudentsForCohort(
                timetable.getAcademicYear(), timetable.getGrade(), timetable.getSection());
        notificationService.createForUsers(withoutCurrentActor(students),
                new NotificationCommand("TIMETABLE", timetable.getId(), studentTitle, studentMessage,
                        "TIMETABLES", "NORMAL", "/my-timetable", eventKey + ":STUDENTS", true));
    }

    private void notifyTimetableSnapshotChanges(TimetableSnapshot before, Timetable after, String eventKey) {
        List<User> facultyRecipients = new ArrayList<>();
        facultyRecipients.add(before.faculty());
        facultyRecipients.add(after.getFaculty());
        notificationService.createForUsers(withoutCurrentActor(facultyRecipients),
                new NotificationCommand("TIMETABLE", after.getId(), "Timetable updated",
                        timetableMessage(after, "An approved timetable entry has changed. Please review your classes."),
                        "TIMETABLES", "NORMAL", "/my-classes", eventKey + ":FACULTY", true));

        List<User> studentRecipients = new ArrayList<>();
        studentRecipients.addAll(activeStudentsForCohort(before.academicYear(), before.grade(), before.section()));
        studentRecipients.addAll(activeStudentsForCohort(after.getAcademicYear(), after.getGrade(), after.getSection()));
        notificationService.createForUsers(withoutCurrentActor(studentRecipients),
                new NotificationCommand("TIMETABLE", after.getId(), "Timetable updated",
                        timetableMessage(after, "Your class timetable has changed. Please review your updated schedule."),
                        "TIMETABLES", "NORMAL", "/my-timetable", eventKey + ":STUDENTS", true));
    }

    private List<User> activeStudentsForCohort(AcademicYear year, Grade grade, Section section) {
        return enrollmentRepository.findByAcademicYearAndGradeAndSectionAndActiveTrue(year, grade, section)
                .stream().map(StudentEnrollment::getStudent)
                .filter(Objects::nonNull).filter(student -> student.getId() != null).toList();
    }

    private String timetableMessage(Timetable timetable, String prefix) {
        return prefix + " " + timetable.getSubject().getName() + " for "
                + timetable.getGrade().getName() + " - " + timetable.getSection().getName()
                + " on " + timetable.getDayOfWeek() + " from " + timetable.getStartTime()
                + " to " + timetable.getEndTime() + ".";
    }

    private List<User> withoutCurrentActor(Collection<User> recipients) {
        Long actorId = currentActorId();
        return recipients.stream().filter(Objects::nonNull)
                .filter(user -> user.getId() != null && !user.getId().equals(actorId)).toList();
    }

    private Long currentActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return null;
        return userRepository.findByUsername(authentication.getName()).map(User::getId).orElse(null);
    }

    private List<User> activeAdminsExcludingCurrentActor() {
        Long actorId = currentActorId();
        return userRepository.findAll().stream()
                .filter(user -> user.isAccountEnabled() && !user.isAccountDeleted())
                .filter(user -> user.getRoles() != null && user.getRoles().stream()
                        .anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN))
                .filter(user -> actorId == null || !actorId.equals(user.getId()))
                .toList();
    }

    private boolean currentUserIsAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private record TimetableSnapshot(AcademicYear academicYear, Grade grade, Section section,
            Subject subject, User faculty, java.time.DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime, ClassType classType,
            LocalDate startDate, LocalDate endDate, String room, String meetingLink,
            String notes, boolean active) {
        private static TimetableSnapshot from(Timetable timetable) {
            return new TimetableSnapshot(timetable.getAcademicYear(), timetable.getGrade(),
                    timetable.getSection(), timetable.getSubject(), timetable.getFaculty(),
                    timetable.getDayOfWeek(), timetable.getStartTime(), timetable.getEndTime(),
                    timetable.getClassType(), timetable.getStartDate(), timetable.getEndDate(),
                    timetable.getRoom(), timetable.getMeetingLink(), timetable.getNotes(), timetable.isActive());
        }

        private boolean hasMeaningfulChanges(Timetable timetable) {
            return !Objects.equals(academicYear.getId(), timetable.getAcademicYear().getId())
                    || !Objects.equals(grade.getId(), timetable.getGrade().getId())
                    || !Objects.equals(section.getId(), timetable.getSection().getId())
                    || !Objects.equals(subject.getId(), timetable.getSubject().getId())
                    || !Objects.equals(faculty.getId(), timetable.getFaculty().getId())
                    || !Objects.equals(dayOfWeek, timetable.getDayOfWeek())
                    || !Objects.equals(startTime, timetable.getStartTime())
                    || !Objects.equals(endTime, timetable.getEndTime())
                    || !Objects.equals(classType, timetable.getClassType())
                    || !Objects.equals(startDate, timetable.getStartDate())
                    || !Objects.equals(endDate, timetable.getEndDate())
                    || !Objects.equals(room, timetable.getRoom())
                    || !Objects.equals(meetingLink, timetable.getMeetingLink())
                    || !Objects.equals(notes, timetable.getNotes())
                    || active != timetable.isActive();
        }
    }

    private String normalizeOptional(
            String value
    ) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new APIException(
                    "User is not authenticated.",
                    HttpStatus.UNAUTHORIZED,
                    "USER_NOT_AUTHENTICATED"
            );
        }

        return authentication.getName();
    }
}