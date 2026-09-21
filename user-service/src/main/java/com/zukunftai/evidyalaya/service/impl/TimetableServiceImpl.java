package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.AcademicYear;
import com.zukunftai.evidyalaya.database.ClassType;
import com.zukunftai.evidyalaya.database.Grade;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.Section;
import com.zukunftai.evidyalaya.database.StudentEnrollment;
import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.model.TimetableRequest;
import com.zukunftai.evidyalaya.repository.AcademicYearRepository;
import com.zukunftai.evidyalaya.repository.GradeRepository;
import com.zukunftai.evidyalaya.repository.SectionRepository;
import com.zukunftai.evidyalaya.repository.StudentEnrollmentRepository;
import com.zukunftai.evidyalaya.repository.SubjectRepository;
import com.zukunftai.evidyalaya.repository.TimetableRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.TimetableService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

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

    public TimetableServiceImpl(
            TimetableRepository timetableRepository,
            AcademicYearRepository academicYearRepository,
            GradeRepository gradeRepository,
            SectionRepository sectionRepository,
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            StudentEnrollmentRepository enrollmentRepository
    ) {
        this.timetableRepository = timetableRepository;
        this.academicYearRepository = academicYearRepository;
        this.gradeRepository = gradeRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
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
                        .startDate(request.getStartDate())
                        .endDate(request.getEndDate())
                        .room(normalizeOptional(request.getRoom()))
                        .meetingLink(normalizeOptional(request.getMeetingLink()))
                        .notes(normalizeOptional(request.getNotes()))
                        .active(active)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();

        return timetableRepository.save(timetable);
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

        Timetable timetable =
                getTimetableById(id);

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

        timetableRepository.save(timetable);
    }

    @Override
    public void enableTimetable(Long id) {

        Timetable timetable =
                getTimetableById(id);

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

        timetableRepository.save(timetable);
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
    public List<Timetable> getMyTimetable() {

        User faculty =
                getCurrentFaculty();

        LocalDate today =
                LocalDate.now();

        return timetableRepository
                .findByFacultyAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        faculty,
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
                .findByAcademicYearAndGradeAndSectionAndActiveTrue(
                        activeAcademicYear,
                        enrollment.getGrade(),
                        enrollment.getSection()
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