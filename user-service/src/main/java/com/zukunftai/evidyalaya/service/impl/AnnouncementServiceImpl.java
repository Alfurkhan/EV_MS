package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
import com.zukunftai.evidyalaya.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class AnnouncementServiceImpl {
    private final AnnouncementRepository announcements;
    private final AnnouncementRecipientRepository recipients;
    private final NotificationService notificationService;
    private final UserRepository users;
    private final StudentEnrollmentRepository enrollments;
    private final TimetableRepository timetables;
    private final AcademicYearRepository years;
    private final GradeRepository grades;
    private final SectionRepository sections;
    private final AnnouncementAttachmentRepository attachmentRepository;
    private final AnnouncementAttachmentStorageService attachmentStorage;

    public AnnouncementServiceImpl(AnnouncementRepository announcements, AnnouncementRecipientRepository recipients,
            UserRepository users, StudentEnrollmentRepository enrollments,
            TimetableRepository timetables, AcademicYearRepository years, GradeRepository grades, SectionRepository sections,
            NotificationService notificationService, AnnouncementAttachmentRepository attachmentRepository,
            AnnouncementAttachmentStorageService attachmentStorage) {
        this.announcements=announcements; this.recipients=recipients; this.users=users;
        this.notificationService=notificationService;
        this.enrollments=enrollments; this.timetables=timetables; this.years=years; this.grades=grades; this.sections=sections;
        this.attachmentRepository=attachmentRepository; this.attachmentStorage=attachmentStorage;
    }

    public List<AnnouncementResponse> list() {
        User user=currentUser();
        Map<Long, Announcement> visible=new LinkedHashMap<>();
        if(hasRole(user,RoleName.ROLE_ADMIN)) {
            announcements.findAll().stream().sorted(Comparator.comparing(Announcement::getCreatedAt).reversed())
                    .forEach(a->visible.put(a.getId(),a));
        } else {
            recipients.findByUserOrderByDeliveredAtDesc(user).forEach(r->visible.put(r.getAnnouncement().getId(),r.getAnnouncement()));
            announcements.findByCreatedByOrderByCreatedAtDesc(user).forEach(a->visible.putIfAbsent(a.getId(),a));
        }
        return visible.values().stream().map(a->response(a,user)).toList();
    }

    public AnnouncementResponse create(AnnouncementRequest request) {
        User actor=currentUser();
        boolean admin=hasRole(actor,RoleName.ROLE_ADMIN);
        if(!admin && !hasRole(actor,RoleName.ROLE_FACULTY)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        validateTarget(request,actor,admin);
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        if(request.expiresAt()!=null && !request.expiresAt().isAfter(now)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expiry must be in the future.");
        if(request.scheduledAt()!=null && request.expiresAt()!=null && !request.expiresAt().isAfter(request.scheduledAt()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expiry must be after scheduled publication.");
        Announcement a=Announcement.builder().title(request.title().trim()).message(request.message().trim())
                .audienceType(request.audienceType()).targetScope(scope(request)).timetableAssignments(resolveAssignments(request,actor,admin)).targetGrades(resolveTargetGrades(request,admin)).academicYear(request.academicYearId()==null?null:years.findById(request.academicYearId()).orElseThrow())
                .grade(request.gradeId()==null?null:grades.findById(request.gradeId()).orElseThrow())
                .section(request.sectionId()==null?null:sections.findById(request.sectionId()).orElseThrow())
                .priority(request.priority()).status(request.scheduledAt()!=null && request.scheduledAt().isAfter(now)?AnnouncementStatus.SCHEDULED:AnnouncementStatus.DRAFT)
                .createdBy(actor).scheduledAt(request.scheduledAt()).expiresAt(request.expiresAt()).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        return response(announcements.save(a),actor);
    }

    public AnnouncementResponse update(Long id, AnnouncementRequest request) {
        User actor=currentUser();
        Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean admin=hasRole(actor,RoleName.ROLE_ADMIN);
        if(!admin && !a.getCreatedBy().getId().equals(actor.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(a.getStatus()==AnnouncementStatus.ARCHIVED) throw new ResponseStatusException(HttpStatus.CONFLICT,"Archived announcements cannot be edited.");
        if(a.getStatus()==AnnouncementStatus.PUBLISHED) {
            String updatedTitle = request.title().trim();
            String updatedMessage = request.message().trim();
            boolean meaningfulChange = !Objects.equals(a.getTitle(), updatedTitle)
                    || !Objects.equals(a.getMessage(), updatedMessage)
                    || !Objects.equals(a.getPriority(), request.priority());
            if (meaningfulChange) {
                a.setTitle(updatedTitle);
                a.setMessage(updatedMessage);
                a.setPriority(request.priority());
                a.setUpdatedAt(Instant.now());
                List<EmailAttachmentSource> currentAttachments = attachmentRepository
                        .findByAnnouncementOrderByCreatedAtAsc(a).stream()
                        .map(file -> new EmailAttachmentSource(
                                attachmentStorage.resolve(file.getStoredPath()).toString(),
                                file.getOriginalName(), file.getContentType()))
                        .toList();
                notificationService.updateForSource("ANNOUNCEMENT", id, a.getTitle(),
                        a.getMessage().length()>1000?a.getMessage().substring(0,997)+"...":a.getMessage(),
                        a.getPriority().name(), currentAttachments, a.getUpdatedAt().toString());
            }
            return response(announcements.save(a),actor);
        }
        validateTarget(request,actor,admin);
        a.setTitle(request.title().trim()); a.setMessage(request.message().trim()); a.setAudienceType(request.audienceType());
        a.setTargetScope(scope(request)); a.setTimetableAssignments(resolveAssignments(request,actor,admin)); a.setTargetGrades(resolveTargetGrades(request,admin));
        a.setAcademicYear(request.academicYearId()==null?null:years.findById(request.academicYearId()).orElseThrow());
        a.setGrade(request.gradeId()==null?null:grades.findById(request.gradeId()).orElseThrow());
        a.setSection(request.sectionId()==null?null:sections.findById(request.sectionId()).orElseThrow());
        a.setPriority(request.priority()); a.setScheduledAt(request.scheduledAt()); a.setExpiresAt(request.expiresAt()); a.setUpdatedAt(Instant.now());
        if(request.scheduledAt()!=null && request.scheduledAt().isAfter(LocalDateTime.now(ZoneId.of("Asia/Kolkata")))) a.setStatus(AnnouncementStatus.SCHEDULED);
        return response(announcements.save(a),actor);
    }

    private static final int MAX_ANNOUNCEMENT_ATTACHMENTS = 5;

    public AnnouncementResponse uploadAttachments(Long id, List<MultipartFile> files) {
        User actor = currentUser();
        Announcement announcement = announcements.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ensureCanManage(announcement, actor);
        if (announcement.getStatus() == AnnouncementStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Archived announcements cannot be changed.");
        }
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at least one attachment.");
        }
        long existingCount = attachmentRepository.countByAnnouncement(announcement);
        if (existingCount + files.size() > MAX_ANNOUNCEMENT_ATTACHMENTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An announcement can have at most 5 attachments.");
        }

        for (MultipartFile file : files) {
            AnnouncementAttachmentStorageService.StoredFile stored = attachmentStorage.store(file);
            attachmentStorage.deleteOnRollback(stored.storedPath());
            attachmentRepository.save(AnnouncementAttachment.builder()
                    .announcement(announcement)
                    .storedPath(stored.storedPath())
                    .originalName(stored.originalName())
                    .contentType(stored.contentType())
                    .fileSize(stored.fileSize())
                    .createdAt(Instant.now())
                    .build());
        }
        announcement.setUpdatedAt(Instant.now());
        return response(announcements.save(announcement), actor);
    }

    public void deleteAttachment(Long announcementId, Long attachmentId) {
        User actor = currentUser();
        Announcement announcement = announcements.findById(announcementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ensureCanManage(announcement, actor);
        if (announcement.getStatus() == AnnouncementStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Archived announcements cannot be changed.");
        }
        AnnouncementAttachment attachment = attachmentRepository.findByIdAndAnnouncement(attachmentId, announcement)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        attachmentRepository.delete(attachment);
        attachmentStorage.deleteAfterCommit(attachment.getStoredPath());
        announcement.setUpdatedAt(Instant.now());
        announcements.save(announcement);
    }

    public AnnouncementAttachment getAttachmentForDownload(Long announcementId, Long attachmentId) {
        User viewer = currentUser();
        Announcement announcement = announcements.findById(announcementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        AnnouncementAttachment attachment = attachmentRepository.findByIdAndAnnouncement(attachmentId, announcement)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        boolean ownerOrAdmin = hasRole(viewer, RoleName.ROLE_ADMIN)
                || announcement.getCreatedBy().getId().equals(viewer.getId());
        if (!ownerOrAdmin) {
            boolean published = announcement.getStatus() == AnnouncementStatus.PUBLISHED
                    || announcement.getStatus() == AnnouncementStatus.ARCHIVED;
            boolean recipient = recipients.findByAnnouncementAndUser(announcement, viewer).isPresent();
            if (!published || !recipient) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not allowed to access this announcement attachment.");
            }
        }
        return attachment;
    }

    public java.nio.file.Path resolveAttachmentPath(String storedPath) {
        return attachmentStorage.resolve(storedPath);
    }

    private void ensureCanManage(Announcement announcement, User actor) {
        if (!hasRole(actor, RoleName.ROLE_ADMIN)
                && !announcement.getCreatedBy().getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public AnnouncementResponse publish(Long id) {
        User actor=currentUser();
        Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!a.getCreatedBy().getId().equals(actor.getId()) && !hasRole(actor,RoleName.ROLE_ADMIN)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(a.getStatus()==AnnouncementStatus.ARCHIVED) throw new ResponseStatusException(HttpStatus.CONFLICT);
        if(a.getScheduledAt()!=null && a.getScheduledAt().isAfter(LocalDateTime.now(ZoneId.of("Asia/Kolkata"))))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"This announcement is scheduled for a future time.");
        if(a.getStatus()==AnnouncementStatus.PUBLISHED) return response(a,actor);
        List<User> targets=resolveRecipients(a);
        if(targets.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"The selected audience has no eligible recipients.");
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        a.setStatus(AnnouncementStatus.PUBLISHED); a.setPublishedAt(now); a.setUpdatedAt(Instant.now());
        announcements.save(a);
        for(User target:targets) {
            AnnouncementRecipient recipient=AnnouncementRecipient.builder().announcement(a).user(target).deliveredAt(now).build();
            recipients.save(recipient);
        }
        notifyPublicationRecipients(a, targets, hasRole(actor, RoleName.ROLE_FACULTY));
        return response(a,actor);
    }

    public void archive(Long id) {
        User actor=currentUser(); Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!a.getCreatedBy().getId().equals(actor.getId()) && !hasRole(actor,RoleName.ROLE_ADMIN)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        a.setStatus(AnnouncementStatus.ARCHIVED); a.setArchivedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata"))); a.setUpdatedAt(Instant.now());
    }


    public void markAllAnnouncementsRead() {
        User user=currentUser();
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        for(AnnouncementRecipient r:recipients.findByUserOrderByDeliveredAtDesc(user)) {
            if(r.getReadAt()==null && r.getAnnouncement().getStatus()==AnnouncementStatus.PUBLISHED) r.setReadAt(now);
        }
    }

    public void delete(Long id) {
        User actor=currentUser();
        Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!hasRole(actor,RoleName.ROLE_ADMIN) && !a.getCreatedBy().getId().equals(actor.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        notificationService.deleteForSource("ANNOUNCEMENT", id);
        List<AnnouncementAttachment> storedAttachments = attachmentRepository.findByAnnouncementOrderByCreatedAtAsc(a);
        attachmentRepository.deleteAll(storedAttachments);
        storedAttachments.forEach(file -> attachmentStorage.deleteAfterCommit(file.getStoredPath()));
        recipients.deleteAll(recipients.findByAnnouncement(a));
        announcements.delete(a);
    }

    public void markAnnouncementRead(Long id) {
        User user=currentUser(); Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        AnnouncementRecipient r=recipients.findByAnnouncementAndUser(a,user).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(r.getReadAt()==null) r.setReadAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
    }

    public void processScheduledAnnouncements() {
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        for(Announcement a:announcements.findByStatusAndScheduledAtLessThanEqual(AnnouncementStatus.SCHEDULED,now)) {
            List<User> targets=resolveRecipients(a);
            if(targets.isEmpty()) continue;
            a.setStatus(AnnouncementStatus.PUBLISHED); a.setPublishedAt(now); a.setUpdatedAt(Instant.now());
            for(User target:targets) {
                recipients.save(AnnouncementRecipient.builder().announcement(a).user(target).deliveredAt(now).build());
            }
            notifyPublicationRecipients(a, targets, hasRole(a.getCreatedBy(), RoleName.ROLE_FACULTY));
        }
        for(Announcement a:announcements.findByStatusAndExpiresAtLessThanEqual(AnnouncementStatus.PUBLISHED,now)) {
            a.setStatus(AnnouncementStatus.ARCHIVED); a.setArchivedAt(now); a.setUpdatedAt(Instant.now());
        }
    }

    private void notifyPublicationRecipients(Announcement announcement, List<User> targets, boolean includeAdminOversight) {
        String audienceContext = "";
        if (announcement.getAudienceType() == AnnouncementAudience.CLASS) {
            if (announcement.getTargetScope() == AnnouncementTargetScope.SUBJECT
                    && !announcement.getTimetableAssignments().isEmpty()) {
                Timetable assignment = announcement.getTimetableAssignments().get(0);
                audienceContext = " for " + assignment.getSubject().getName() + ", "
                        + assignment.getGrade().getName() + " - " + assignment.getSection().getName();
            } else if (announcement.getGrade() != null && announcement.getSection() != null) {
                audienceContext = " for " + announcement.getGrade().getName()
                        + " - " + announcement.getSection().getName();
            }
        } else if (announcement.getAudienceType() == AnnouncementAudience.GRADE
                && !announcement.getTargetGrades().isEmpty()) {
            audienceContext = " for " + String.join(", ", announcement.getTargetGrades().stream()
                    .map(Grade::getName).toList()) + " (" + announcement.getAcademicYear().getName() + ")";
        }
        String message = "Published by " + announcement.getCreatedBy().getFullName()
                + audienceContext + ". " + announcement.getMessage();
        NotificationCommand command = new NotificationCommand(
                "ANNOUNCEMENT", announcement.getId(), announcement.getTitle(),
                message.length() > 1000 ? message.substring(0, 997) + "..." : message,
                "ANNOUNCEMENTS", announcement.getPriority().name(),
                "/announcements", "ANNOUNCEMENT:" + announcement.getId(), true,
                Map.of(),
                attachmentRepository.findByAnnouncementOrderByCreatedAtAsc(announcement).stream()
                        .map(file -> new EmailAttachmentSource(
                                attachmentStorage.resolve(file.getStoredPath()).toString(),
                                file.getOriginalName(), file.getContentType()))
                        .toList());
        if (includeAdminOversight) {
            notificationService.createForUsersAndAdmins(targets, command);
        } else {
            notificationService.createForUsers(targets, command);
        }
    }

    private List<User> resolveRecipients(Announcement a) {
        if (a.getAudienceType() == AnnouncementAudience.GRADE) {
            if (a.getAcademicYear() == null || !a.getAcademicYear().isActive()
                    || a.getTargetGrades().isEmpty()
                    || a.getTargetGrades().stream().anyMatch(grade -> !grade.isActive()
                    || !grade.getAcademicYear().getId().equals(a.getAcademicYear().getId()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The selected academic year or one of its grades is no longer active.");
            }
            Set<User> targets = new LinkedHashSet<>();
            enrollments.findByAcademicYearAndGradeInAndActiveTrue(a.getAcademicYear(), a.getTargetGrades())
                    .stream().map(StudentEnrollment::getStudent)
                    .filter(student -> student.isAccountEnabled() && !student.isAccountDeleted())
                    .filter(student -> hasRole(student, RoleName.ROLE_STUDENT))
                    .forEach(targets::add);
            return new ArrayList<>(targets);
        }
        if(a.getAudienceType()==AnnouncementAudience.CLASS) {
            if(a.getTargetScope()==AnnouncementTargetScope.SUBJECT) {
                Set<User> targets=new LinkedHashSet<>();
                for(Timetable assignment:a.getTimetableAssignments()) {
                    if(!assignment.isActive() || assignment.getStatus()!=TimetableStatus.APPROVED)
                        throw new ResponseStatusException(HttpStatus.CONFLICT,"A selected subject assignment is no longer active and approved.");
                    if(a.getCreatedBy().getRoles().stream().anyMatch(r->r.getName()==RoleName.ROLE_FACULTY)
                            && !assignment.getFaculty().getId().equals(a.getCreatedBy().getId()))
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,"A selected subject assignment is no longer assigned to the announcement author.");
                    enrollments.findByAcademicYearAndGradeAndSectionAndActiveTrue(assignment.getAcademicYear(),assignment.getGrade(),assignment.getSection())
                            .stream().map(StudentEnrollment::getStudent).forEach(targets::add);
                }
                return new ArrayList<>(targets);
            }
            if(a.getCreatedBy().getRoles().stream().anyMatch(r->r.getName()==RoleName.ROLE_FACULTY)
                    && timetables.findByFacultyAndStatusAndActiveTrue(a.getCreatedBy(),TimetableStatus.APPROVED).stream()
                    .noneMatch(t->t.getAcademicYear().getId().equals(a.getAcademicYear().getId())
                            && t.getGrade().getId().equals(a.getGrade().getId()) && t.getSection().getId().equals(a.getSection().getId())))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can only announce to your approved assigned classes.");
            return enrollments.findByAcademicYearAndGradeAndSectionAndActiveTrue(a.getAcademicYear(),a.getGrade(),a.getSection())
                    .stream().map(StudentEnrollment::getStudent).distinct().toList();
        }
        return users.findAll().stream().filter(u->!u.isAccountDeleted() && u.isAccountEnabled())
                .filter(u->u.getRoles().stream().anyMatch(r->a.getAudienceType()==AnnouncementAudience.ALL
                        ? r.getName()==RoleName.ROLE_STUDENT || r.getName()==RoleName.ROLE_FACULTY
                        : a.getAudienceType()==AnnouncementAudience.STUDENTS ? r.getName()==RoleName.ROLE_STUDENT
                        : r.getName()==RoleName.ROLE_FACULTY)).toList();
    }

    private AnnouncementTargetScope scope(AnnouncementRequest request) {
        return request.targetScope()==null?AnnouncementTargetScope.CLASS:request.targetScope();
    }

    private List<Grade> resolveTargetGrades(AnnouncementRequest request, boolean admin) {
        if (request.audienceType() != AnnouncementAudience.GRADE) return new ArrayList<>();
        if (!admin) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only administrators can publish announcements to selected grades.");
        AcademicYear year = years.findById(request.academicYearId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year not found."));
        List<Long> ids = request.gradeIds().stream().distinct().toList();
        List<Grade> selected = grades.findAllById(ids);
        if (selected.size() != ids.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "One or more selected grades do not exist.");
        if (!year.isActive() || selected.stream().anyMatch(grade -> !grade.isActive()
                || !grade.getAcademicYear().getId().equals(year.getId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Select active grades belonging to the selected active academic year.");
        }
        return selected.stream().sorted(Comparator.comparing(Grade::getName, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    private List<Timetable> resolveAssignments(AnnouncementRequest request, User actor, boolean admin) {
        if(request.audienceType()!=AnnouncementAudience.CLASS || scope(request)!=AnnouncementTargetScope.SUBJECT)
            return new ArrayList<>();
        List<Long> ids=request.timetableAssignmentIds()==null?List.of():request.timetableAssignmentIds().stream().distinct().toList();
        if(ids.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select at least one class assignment for this subject.");
        List<Timetable> selected=timetables.findAllById(ids);
        if(selected.size()!=ids.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"One or more selected timetable assignments do not exist.");
        LocalDate today=LocalDate.now(ZoneId.of("Asia/Kolkata"));
        for(Timetable t:selected) {
            if(!t.isActive() || t.getStatus()!=TimetableStatus.APPROVED || today.isBefore(t.getStartDate()) || today.isAfter(t.getEndDate()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only currently active, approved timetable assignments can be targeted.");
            if(!admin && !t.getFaculty().getId().equals(actor.getId()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can only target your own approved subject assignments.");
        }
        Long subjectId=selected.get(0).getSubject().getId();
        if(selected.stream().anyMatch(t->!t.getSubject().getId().equals(subjectId)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"All selected class assignments must belong to the same subject.");
        return selected;
    }

    private void validateTarget(AnnouncementRequest r, User actor, boolean admin) {
        List<Long> requestedGradeIds = r.gradeIds() == null ? List.of() : r.gradeIds().stream().distinct().toList();
        if (r.audienceType() == AnnouncementAudience.GRADE) {
            if (!admin) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only administrators can target selected grades.");
            if (scope(r) != AnnouncementTargetScope.CLASS || r.academicYearId() == null
                    || requestedGradeIds.isEmpty() || r.gradeId() != null || r.sectionId() != null
                    || (r.timetableAssignmentIds() != null && !r.timetableAssignmentIds().isEmpty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Select an academic year and at least one grade; grade targeting cannot include a section or subject assignment.");
            }
            AcademicYear year = years.findById(r.academicYearId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year not found."));
            List<Grade> selected = grades.findAllById(requestedGradeIds);
            if (!year.isActive() || selected.size() != requestedGradeIds.size()
                    || selected.stream().anyMatch(grade -> !grade.isActive()
                    || !grade.getAcademicYear().getId().equals(year.getId()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Select active grades belonging to the selected active academic year.");
            }
            return;
        }
        if (!requestedGradeIds.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Grade IDs are only valid for selected-grade announcements.");
        if(r.audienceType()!=AnnouncementAudience.CLASS && scope(r)!=AnnouncementTargetScope.CLASS)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Subject targeting is available only for class announcements.");
        if(!admin && r.audienceType()!=AnnouncementAudience.CLASS) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Faculty can only publish to assigned classes.");
        if(r.audienceType()==AnnouncementAudience.CLASS && scope(r)==AnnouncementTargetScope.CLASS
                && (r.academicYearId()==null||r.gradeId()==null||r.sectionId()==null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select academic year, grade and section.");
        if(r.audienceType()==AnnouncementAudience.CLASS && scope(r)==AnnouncementTargetScope.SUBJECT) {
            if(r.timetableAssignmentIds()==null || r.timetableAssignmentIds().isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select at least one class assignment for this subject.");
            if(r.academicYearId()!=null||r.gradeId()!=null||r.sectionId()!=null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Subject targeting uses timetable assignments, not a single class target.");
        }
        if(!admin && r.audienceType()==AnnouncementAudience.CLASS && scope(r)==AnnouncementTargetScope.CLASS) {
            boolean assigned=timetables.findByFacultyAndStatusAndActiveTrue(actor,TimetableStatus.APPROVED).stream()
                    .anyMatch(t->t.isActive()&&t.getAcademicYear().getId().equals(r.academicYearId())&&t.getGrade().getId().equals(r.gradeId())&&t.getSection().getId().equals(r.sectionId()));
            if(!assigned) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can only target classes assigned to you.");
        }
    }
    private AnnouncementResponse response(Announcement a,User viewer) {
        AnnouncementRecipient own=recipients.findByAnnouncementAndUser(a,viewer).orElse(null);
        boolean admin=hasRole(viewer,RoleName.ROLE_ADMIN);
        boolean facultyOwner=hasRole(viewer,RoleName.ROLE_FACULTY) && a.getCreatedBy().getId().equals(viewer.getId());
        boolean canViewReadStatus=admin || facultyOwner;
        boolean canManage=a.getCreatedBy().getId().equals(viewer.getId()) || admin;
        String subjectName=a.getTargetScope()==AnnouncementTargetScope.SUBJECT && !a.getTimetableAssignments().isEmpty()
                ?a.getTimetableAssignments().get(0).getSubject().getName():null;
        return new AnnouncementResponse(a.getId(),a.getTitle(),a.getMessage(),a.getAudienceType(),
                a.getAcademicYear()==null?null:a.getAcademicYear().getId(),a.getGrade()==null?null:a.getGrade().getId(),
                a.getSection()==null?null:a.getSection().getId(),
                a.getTargetGrades().stream().map(Grade::getId).toList(),
                a.getTargetGrades().stream().map(Grade::getName).toList(),
                a.getTargetScope(),subjectName,
                a.getTimetableAssignments().stream().map(Timetable::getId).toList(),
                a.getTimetableAssignments().stream().map(t->t.getAcademicYear().getName()+" · "+t.getGrade().getName()+" · "+t.getSection().getName()).distinct().toList(),
                a.getPriority(),a.getStatus(),
                a.getCreatedBy().getFullName(),a.getScheduledAt(),a.getExpiresAt(),a.getPublishedAt(),
                canViewReadStatus?recipients.countByAnnouncementAndReadAtIsNotNull(a):0,
                canViewReadStatus?recipients.countByAnnouncementAndReadAtIsNull(a):0,
                own==null?null:own.getReadAt(),canManage,a.getCreatedAt(),a.getUpdatedAt(),
                attachmentRepository.findByAnnouncementOrderByCreatedAtAsc(a).stream()
                        .map(file -> new AnnouncementAttachmentResponse(file.getId(), file.getOriginalName(),
                                file.getContentType(), file.getFileSize(), file.getCreatedAt(),
                                "/announcements/" + a.getId() + "/attachments/" + file.getId()))
                        .toList());
    }
    private User currentUser() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null||!auth.isAuthenticated()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return users.findByUsername(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private boolean hasRole(User user,RoleName role) { return user.getRoles().stream().anyMatch(r->r.getName()==role); }
}
