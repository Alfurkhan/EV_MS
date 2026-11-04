package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.repository.*;
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
    private final UserRepository users;
    private final StudentEnrollmentRepository enrollments;
    private final TimetableRepository timetables;
    private final AcademicYearRepository years;
    private final GradeRepository grades;
    private final SectionRepository sections;

    public AnnouncementServiceImpl(AnnouncementRepository announcements, AnnouncementRecipientRepository recipients,
            NotificationRepository notifications, UserRepository users, StudentEnrollmentRepository enrollments,
            TimetableRepository timetables, AcademicYearRepository years, GradeRepository grades, SectionRepository sections) {
        this.announcements=announcements; this.recipients=recipients; this.notifications=notifications; this.users=users;
        this.enrollments=enrollments; this.timetables=timetables; this.years=years; this.grades=grades; this.sections=sections;
    }

    public List<AnnouncementResponse> list() {
        User user=currentUser();
        Map<Long, Announcement> visible=new LinkedHashMap<>();
        recipients.findByUserOrderByDeliveredAtDesc(user).forEach(r->visible.put(r.getAnnouncement().getId(),r.getAnnouncement()));
        announcements.findByCreatedByOrderByCreatedAtDesc(user).stream()
                .filter(a->a.getStatus()==AnnouncementStatus.DRAFT || a.getStatus()==AnnouncementStatus.SCHEDULED)
                .forEach(a->visible.putIfAbsent(a.getId(),a));
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
                .audienceType(request.audienceType()).academicYear(request.academicYearId()==null?null:years.findById(request.academicYearId()).orElseThrow())
                .grade(request.gradeId()==null?null:grades.findById(request.gradeId()).orElseThrow())
                .section(request.sectionId()==null?null:sections.findById(request.sectionId()).orElseThrow())
                .priority(request.priority()).status(request.scheduledAt()!=null && request.scheduledAt().isAfter(now)?AnnouncementStatus.SCHEDULED:AnnouncementStatus.DRAFT)
                .createdBy(actor).scheduledAt(request.scheduledAt()).expiresAt(request.expiresAt()).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        return response(announcements.save(a),actor);
    }

    public AnnouncementResponse update(Long id, AnnouncementRequest request) {
        User actor=currentUser();
        Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!a.getCreatedBy().getId().equals(actor.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(a.getStatus()==AnnouncementStatus.ARCHIVED) throw new ResponseStatusException(HttpStatus.CONFLICT,"Archived announcements cannot be edited.");
        if(a.getStatus()==AnnouncementStatus.PUBLISHED && !recipients.findByAnnouncement(a).isEmpty())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"A published announcement with recipients cannot be edited. Archive it and publish a corrected announcement.");
        validateTarget(request,actor,hasRole(actor,RoleName.ROLE_ADMIN));
        a.setTitle(request.title().trim()); a.setMessage(request.message().trim()); a.setAudienceType(request.audienceType());
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
            notifications.save(Notification.builder().user(target).sourceType("ANNOUNCEMENT").sourceId(a.getId())
                    .title(a.getTitle()).message(a.getMessage().length()>1000?a.getMessage().substring(0,997)+"...":a.getMessage())
                    .category("ANNOUNCEMENTS").priority(a.getPriority().name()).targetUrl("/announcements")
                    .deduplicationKey("ANNOUNCEMENT:"+a.getId()+":"+target.getId()).createdAt(Instant.now()).updatedAt(Instant.now()).build());
        }
        return response(a,actor);
    }

    public void archive(Long id) {
        User actor=currentUser(); Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!a.getCreatedBy().getId().equals(actor.getId()) && !hasRole(actor,RoleName.ROLE_ADMIN)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        a.setStatus(AnnouncementStatus.ARCHIVED); a.setArchivedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata"))); a.setUpdatedAt(Instant.now());
    }

    public void markAnnouncementRead(Long id) {
        User user=currentUser(); Announcement a=announcements.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        AnnouncementRecipient r=recipients.findByAnnouncementAndUser(a,user).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(r.getReadAt()==null) r.setReadAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
    }

    public List<NotificationResponse> notifications() {
        User user=currentUser();
        return this.notifications.findTop100ByUserOrderByCreatedAtDesc(user).stream().map(this::notificationResponse).toList();
    }
    public long unreadCount() { return notifications.countByUserAndReadAtIsNull(currentUser()); }
    public NotificationResponse markRead(Long id) {
        User user=currentUser(); Notification n=notifications.findByIdAndUser(id,user).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(n.getReadAt()==null) n.setReadAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        return notificationResponse(n);
    }
    public void markAllRead() {
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        notifications.findTop100ByUserOrderByCreatedAtDesc(currentUser()).stream().filter(n->n.getReadAt()==null).forEach(n->n.setReadAt(now));
    }
    public NotificationResponse createManualNotification(ManualNotificationRequest request) {
        User actor=currentUser();
        if(!hasRole(actor,RoleName.ROLE_ADMIN)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        User target=users.findById(request.userId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Recipient not found."));
        Notification n=Notification.builder().user(target).sourceType("MANUAL").title(request.title().trim())
                .message(request.message().trim()).category(request.category().trim()).priority(request.priority())
                .targetUrl(request.targetUrl()).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        return notificationResponse(notifications.save(n));
    }

    public NotificationResponse updateManualNotification(Long id, ManualNotificationRequest request) {
        User actor=currentUser(); if(!hasRole(actor,RoleName.ROLE_ADMIN)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Notification n=notifications.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!"MANUAL".equals(n.getSourceType())) throw new ResponseStatusException(HttpStatus.CONFLICT,"System-generated notifications cannot be edited.");
        n.setTitle(request.title().trim()); n.setMessage(request.message().trim()); n.setCategory(request.category().trim());
        n.setPriority(request.priority()); n.setTargetUrl(request.targetUrl()); n.setUpdatedAt(Instant.now());
        return notificationResponse(n);
    }

    private List<User> resolveRecipients(Announcement a) {
        if(a.getAudienceType()==AnnouncementAudience.CLASS) {
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

    private void validateTarget(AnnouncementRequest r, User actor, boolean admin) {
        if(!admin && r.audienceType()!=AnnouncementAudience.CLASS) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Faculty can only publish to assigned classes.");
        if(r.audienceType()==AnnouncementAudience.CLASS && (r.academicYearId()==null||r.gradeId()==null||r.sectionId()==null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select academic year, grade and section.");
        if(!admin && r.audienceType()==AnnouncementAudience.CLASS) {
            boolean assigned=timetables.findByFacultyAndStatusAndActiveTrue(actor,TimetableStatus.APPROVED).stream()
                    .anyMatch(t->t.getAcademicYear().getId().equals(r.academicYearId())&&t.getGrade().getId().equals(r.gradeId())&&t.getSection().getId().equals(r.sectionId()));
            if(!assigned) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can only target classes assigned to you.");
        }
    }
    private AnnouncementResponse response(Announcement a,User viewer) {
        AnnouncementRecipient own=recipients.findByAnnouncementAndUser(a,viewer).orElse(null);
        return new AnnouncementResponse(a.getId(),a.getTitle(),a.getMessage(),a.getAudienceType(),
                a.getAcademicYear()==null?null:a.getAcademicYear().getId(),a.getGrade()==null?null:a.getGrade().getId(),
                a.getSection()==null?null:a.getSection().getId(),a.getPriority(),a.getStatus(),
                a.getCreatedBy().getFullName(),a.getScheduledAt(),a.getExpiresAt(),a.getPublishedAt(),
                recipients.countByAnnouncementAndReadAtIsNotNull(a),recipients.countByAnnouncementAndReadAtIsNull(a),
                own==null?null:own.getReadAt(),a.getCreatedAt(),a.getUpdatedAt());
    }
    private NotificationResponse notificationResponse(Notification n) {
        return new NotificationResponse(n.getId(),n.getSourceType(),n.getSourceId(),n.getTitle(),n.getMessage(),n.getCategory(),
                n.getPriority(),n.getTargetUrl(),n.getReadAt()!=null,n.getReadAt(),n.getCreatedAt());
    }
    private User currentUser() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null||!auth.isAuthenticated()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return users.findByUsername(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private boolean hasRole(User user,RoleName role) { return user.getRoles().stream().anyMatch(r->r.getName()==role); }
}
