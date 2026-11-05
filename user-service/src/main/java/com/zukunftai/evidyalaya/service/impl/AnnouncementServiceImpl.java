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
import java.time.*;
import java.util.*;

@Service
@Transactional
public class AnnouncementServiceImpl {
    private final AnnouncementRepository announcements;
    private final AnnouncementRecipientRepository recipients;
    private final NotificationRepository notifications;
    private final NotificationService notificationService;
    private final UserRepository users;
    private final StudentEnrollmentRepository enrollments;
    private final TimetableRepository timetables;
    private final AcademicYearRepository years;
    private final GradeRepository grades;
    private final SectionRepository sections;

    public AnnouncementServiceImpl(AnnouncementRepository announcements, AnnouncementRecipientRepository recipients,
            NotificationRepository notifications, UserRepository users, StudentEnrollmentRepository enrollments,
            TimetableRepository timetables, AcademicYearRepository years, GradeRepository grades, SectionRepository sections,
            NotificationService notificationService) {
        this.announcements=announcements; this.recipients=recipients; this.notifications=notifications; this.users=users;
        this.notificationService=notificationService;
        this.enrollments=enrollments; this.timetables=timetables; this.years=years; this.grades=grades; this.sections=sections;
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
                .audienceType(request.audienceType()).targetScope(scope(request)).timetableAssignments(resolveAssignments(request,actor,admin)).academicYear(request.academicYearId()==null?null:years.findById(request.academicYearId()).orElseThrow())
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
            a.setTitle(request.title().trim()); a.setMessage(request.message().trim()); a.setPriority(request.priority()); a.setUpdatedAt(Instant.now());
            for(Notification n:notifications.findAll().stream().filter(n->"ANNOUNCEMENT".equals(n.getSourceType()) && id.equals(n.getSourceId())).toList()) {
                n.setTitle(a.getTitle()); n.setMessage(a.getMessage().length()>1000?a.getMessage().substring(0,997)+"...":a.getMessage());
                n.setPriority(a.getPriority().name()); n.setUpdatedAt(Instant.now());
            }
            return response(announcements.save(a),actor);
        }
        validateTarget(request,actor,admin);
        a.setTitle(request.title().trim()); a.setMessage(request.message().trim()); a.setAudienceType(request.audienceType());
        a.setTargetScope(scope(request)); a.setTimetableAssignments(resolveAssignments(request,actor,admin));
        a.setAcademicYear(request.academicYearId()==null?null:years.findById(request.academicYearId()).orElseThrow());
        a.setGrade(request.gradeId()==null?null:grades.findById(request.gradeId()).orElseThrow());
        a.setSection(request.sectionId()==null?null:sections.findById(request.sectionId()).orElseThrow());
        a.setPriority(request.priority()); a.setScheduledAt(request.scheduledAt()); a.setExpiresAt(request.expiresAt()); a.setUpdatedAt(Instant.now());
        if(request.scheduledAt()!=null && request.scheduledAt().isAfter(LocalDateTime.now(ZoneId.of("Asia/Kolkata")))) a.setStatus(AnnouncementStatus.SCHEDULED);
        return response(announcements.save(a),actor);
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
        notificationService.createForUsers(targets, new NotificationCommand(
                "ANNOUNCEMENT", a.getId(), a.getTitle(),
                a.getMessage().length()>1000?a.getMessage().substring(0,997)+"...":a.getMessage(),
                "ANNOUNCEMENTS", a.getPriority().name(), "/announcements", "ANNOUNCEMENT:"+a.getId()));
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
        List<Notification> linked=notifications.findAll().stream()
                .filter(n->"ANNOUNCEMENT".equals(n.getSourceType()) && id.equals(n.getSourceId())).toList();
        notifications.deleteAll(linked);
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
            notificationService.createForUsers(targets, new NotificationCommand(
                    "ANNOUNCEMENT", a.getId(), a.getTitle(),
                    a.getMessage().length()>1000?a.getMessage().substring(0,997)+"...":a.getMessage(),
                    "ANNOUNCEMENTS", a.getPriority().name(), "/announcements", "ANNOUNCEMENT:"+a.getId()));
        }
        for(Announcement a:announcements.findByStatusAndExpiresAtLessThanEqual(AnnouncementStatus.PUBLISHED,now)) {
            a.setStatus(AnnouncementStatus.ARCHIVED); a.setArchivedAt(now); a.setUpdatedAt(Instant.now());
        }
    }

    private List<User> resolveRecipients(Announcement a) {
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
                a.getSection()==null?null:a.getSection().getId(),a.getTargetScope(),subjectName,
                a.getTimetableAssignments().stream().map(Timetable::getId).toList(),
                a.getTimetableAssignments().stream().map(t->t.getAcademicYear().getName()+" · "+t.getGrade().getName()+" · "+t.getSection().getName()).distinct().toList(),
                a.getPriority(),a.getStatus(),
                a.getCreatedBy().getFullName(),a.getScheduledAt(),a.getExpiresAt(),a.getPublishedAt(),
                canViewReadStatus?recipients.countByAnnouncementAndReadAtIsNotNull(a):0,
                canViewReadStatus?recipients.countByAnnouncementAndReadAtIsNull(a):0,
                own==null?null:own.getReadAt(),canManage,a.getCreatedAt(),a.getUpdatedAt());
    }
    private User currentUser() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null||!auth.isAuthenticated()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return users.findByUsername(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private boolean hasRole(User user,RoleName role) { return user.getRoles().stream().anyMatch(r->r.getName()==role); }
}
