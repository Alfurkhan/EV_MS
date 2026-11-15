package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.config.EmailNotificationProperties;
import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import com.zukunftai.evidyalaya.database.EmailNotificationOutboxStatus;
import com.zukunftai.evidyalaya.database.Notification;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.ManualNotificationRequest;
import com.zukunftai.evidyalaya.model.EmailAttachmentSource;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.model.NotificationResponse;
import com.zukunftai.evidyalaya.repository.EmailNotificationOutboxRepository;
import com.zukunftai.evidyalaya.repository.NotificationRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.NotificationService;
import com.zukunftai.evidyalaya.service.email.EmailAttachmentSnapshotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");
    private static final Set<String> EMAIL_ELIGIBLE_SOURCE_TYPES = Set.of(
            "ANNOUNCEMENT", "ASSIGNMENT", "ASSESSMENT", "TIMETABLE", "RESULT"
    );

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final EmailNotificationOutboxRepository emailOutbox;
    private final EmailNotificationProperties emailNotificationProperties;
    private final EmailAttachmentSnapshotService attachmentSnapshotService;

    @Autowired
    public NotificationServiceImpl(
            NotificationRepository notifications,
            UserRepository users,
            EmailNotificationOutboxRepository emailOutbox,
            EmailNotificationProperties emailNotificationProperties,
            EmailAttachmentSnapshotService attachmentSnapshotService
    ) {
        this.notifications = notifications;
        this.users = users;
        this.emailOutbox = emailOutbox;
        this.emailNotificationProperties = emailNotificationProperties;
        this.attachmentSnapshotService = attachmentSnapshotService;
    }

    /** Backward-compatible constructor for tests and in-app-only callers. */
    public NotificationServiceImpl(
            NotificationRepository notifications,
            UserRepository users,
            EmailNotificationOutboxRepository emailOutbox,
            EmailNotificationProperties emailNotificationProperties
    ) {
        this.notifications = notifications;
        this.users = users;
        this.emailOutbox = emailOutbox;
        this.emailNotificationProperties = emailNotificationProperties;
        this.attachmentSnapshotService = null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> listForCurrentUser() {
        User user = currentUser();
        return notifications.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount() {
        return notifications.countByUserAndReadAtIsNull(currentUser());
    }

    @Override
    public NotificationResponse markRead(Long id) {
        User user = currentUser();
        Notification notification = notifications.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now(APP_ZONE));
        }
        return toResponse(notification);
    }

    @Override
    public void markAllRead() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        notifications.findByUserAndReadAtIsNull(currentUser())
                .forEach(notification -> notification.setReadAt(now));
    }

    @Override
    public NotificationResponse createManualNotification(ManualNotificationRequest request) {
        if (!hasRole(currentUser(), RoleName.ROLE_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        User recipient = users.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found."));
        Instant now = Instant.now();
        Notification notification = Notification.builder()
                .user(recipient)
                .sourceType("MANUAL")
                .title(request.title().trim())
                .message(request.message().trim())
                .category(request.category().trim())
                .priority(request.priority())
                .targetUrl(request.targetUrl())
                .createdAt(now)
                .updatedAt(now)
                .build();
        return toResponse(notifications.save(notification));
    }

    @Override
    public NotificationResponse updateManualNotification(Long id, ManualNotificationRequest request) {
        if (!hasRole(currentUser(), RoleName.ROLE_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Notification notification = notifications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"MANUAL".equals(notification.getSourceType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "System-generated notifications cannot be edited.");
        }
        notification.setTitle(request.title().trim());
        notification.setMessage(request.message().trim());
        notification.setCategory(request.category().trim());
        notification.setPriority(request.priority());
        notification.setTargetUrl(request.targetUrl());
        notification.setUpdatedAt(Instant.now());
        return toResponse(notification);
    }

    /**
     * Adds enabled, non-deleted Admin users to the event recipients. The
     * regular creation path deduplicates recipients and uses stable event keys.
     */
    @Override
    public int createForUsersAndAdmins(Collection<User> recipients, NotificationCommand command) {
        List<User> combined = new ArrayList<>();
        if (recipients != null) combined.addAll(recipients);
        users.findAll().stream()
                .filter(user -> user.isAccountEnabled() && !user.isAccountDeleted())
                .filter(user -> hasRole(user, RoleName.ROLE_ADMIN))
                .forEach(combined::add);
        return createForUsers(combined, command);
    }

    /**
     * Creates at most one notification per recipient for the supplied event.
     * A unique database constraint remains the final protection against races.
     */
    @Override
    public int createForUsers(Collection<User> recipients, NotificationCommand command) {
        if (recipients == null || recipients.isEmpty()) {
            return 0;
        }

        Map<Long, User> uniqueRecipients = new LinkedHashMap<>();
        for (User recipient : recipients) {
            if (recipient != null && recipient.getId() != null) {
                uniqueRecipients.putIfAbsent(recipient.getId(), recipient);
            }
        }

        List<String> attachmentSnapshotIds = List.of();
        if (command.emailEligible() && command.attachmentSources() != null
                && !command.attachmentSources().isEmpty()
                && attachmentSnapshotService != null
                && hasNewEligibleEmailRecipient(uniqueRecipients.values(), command)) {
            attachmentSnapshotIds = attachmentSnapshotService.snapshot(command.attachmentSources());
        }

        int created = 0;
        Instant now = Instant.now();
        for (User recipient : uniqueRecipients.values()) {
            String deduplicationKey = command.deduplicationKeyPrefix() == null
                    || command.deduplicationKeyPrefix().isBlank()
                    ? null
                    : command.deduplicationKeyPrefix() + ":" + recipient.getId();

            if (deduplicationKey != null && deduplicationKey.length() > 180) {
                throw new IllegalArgumentException("Notification deduplication keys must be 180 characters or fewer.");
            }
            if (deduplicationKey != null && notifications.existsByDeduplicationKey(deduplicationKey)) {
                continue;
            }

            Notification notification = Notification.builder()
                    .user(recipient)
                    .sourceType(limit(command.sourceType(), 20))
                    .sourceId(command.sourceId())
                    .title(limit(command.title(), 200))
                    .message(limit(command.message(), 1000))
                    .category(limit(command.category(), 30))
                    .priority(limit(command.priority(), 20))
                    .targetUrl(limit(command.targetUrl(), 500))
                    .deduplicationKey(deduplicationKey)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            Notification savedNotification = notifications.save(notification);
            queueEmailIfEligible(savedNotification, recipient, command, attachmentSnapshotIds);
            created++;
        }
        return created;
    }


    private boolean hasNewEligibleEmailRecipient(Collection<User> recipients, NotificationCommand command) {
        String sourceType = command.sourceType() == null ? ""
                : command.sourceType().trim().toUpperCase(java.util.Locale.ROOT);
        if (!EMAIL_ELIGIBLE_SOURCE_TYPES.contains(sourceType)
                || !emailNotificationProperties.isGloballyEnabled()
                || !emailNotificationProperties.isEventEnabled(sourceType)) return false;

        for (User recipient : recipients) {
            if (recipient == null || !recipient.isAccountEnabled() || recipient.isAccountDeleted()
                    || !recipient.isEmailVerified() || recipient.getEmail() == null
                    || recipient.getEmail().isBlank()
                    || emailNotificationProperties.isTestEmailAddress(recipient.getEmail())) continue;
            String key = command.deduplicationKeyPrefix() == null
                    || command.deduplicationKeyPrefix().isBlank()
                    ? null : command.deduplicationKeyPrefix() + ":" + recipient.getId();
            if (key == null || !notifications.existsByDeduplicationKey(key)) return true;
        }
        return false;
    }

    /**
     * Creates an email outbox snapshot only for explicitly opted-in, allowlisted
     * business events and recipients who are eligible for email delivery.
     * This method runs in the same transaction as the in-app notification save.
     */
    private void queueEmailIfEligible(Notification notification, User recipient, NotificationCommand command, List<String> attachmentSnapshotIds) {
        String sourceType = command.sourceType() == null
                ? ""
                : command.sourceType().trim().toUpperCase(java.util.Locale.ROOT);

        if (!command.emailEligible()
                || !EMAIL_ELIGIBLE_SOURCE_TYPES.contains(sourceType)
                || !recipient.isAccountEnabled()
                || recipient.isAccountDeleted()
                || !recipient.isEmailVerified()
                || recipient.getEmail() == null
                || recipient.getEmail().isBlank()) {
            return;
        }

        boolean testEmailAddress = emailNotificationProperties.isTestEmailAddress(recipient.getEmail());
        boolean globallyEnabled = emailNotificationProperties.isGloballyEnabled();
        boolean eventEnabled = emailNotificationProperties.isEventEnabled(sourceType);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sourceType", sourceType);
        payload.put("userName", recipient.getFullName() == null || recipient.getFullName().isBlank()
                ? "eVidyalaya user" : recipient.getFullName());
        payload.put("sourceId", notification.getSourceId());
        payload.put("title", notification.getTitle());
        payload.put("message", notification.getMessage());
        payload.put("category", notification.getCategory());
        payload.put("priority", notification.getPriority());
        payload.put("targetUrl", notification.getTargetUrl());
        payload.put("createdAt", notification.getCreatedAt() == null
                ? Instant.now().toString()
                : notification.getCreatedAt().toString());

        if (attachmentSnapshotIds != null && !attachmentSnapshotIds.isEmpty()) {
            payload.put("attachmentSnapshotIds", attachmentSnapshotIds);
        }

        // Only the matching recipient's private result snapshot is copied into
        // their outbox payload; no other student's result enters this email.
        Map<String, Object> recipientEmailData = command.recipientEmailData() == null
                ? null
                : command.recipientEmailData().get(recipient.getId());
        if (recipientEmailData != null && !recipientEmailData.isEmpty()) {
            payload.putAll(recipientEmailData);
        }

        String deduplicationKey = notification.getDeduplicationKey() == null
                ? "NOTIFICATION:" + notification.getId()
                : notification.getDeduplicationKey();

        EmailNotificationOutbox outboxEntry = EmailNotificationOutbox.builder()
                .notificationId(notification.getId())
                .recipientUserId(recipient.getId())
                .recipientEmail(recipient.getEmail().trim())
                .templateType(sourceType)
                .subject(notification.getTitle())
                .payload(payload)
                .deduplicationKey(deduplicationKey)
                .status(!testEmailAddress && globallyEnabled && eventEnabled
                        ? EmailNotificationOutboxStatus.PENDING
                        : EmailNotificationOutboxStatus.SKIPPED)
                .lastError(testEmailAddress
                        ? "TEST_EMAIL_DOMAIN"
                        : (!globallyEnabled
                                ? "Email notifications are disabled by configuration."
                                : (!eventEnabled
                                        ? "Email notifications for this event are disabled by configuration."
                                        : null)))
                .build();

        emailOutbox.save(outboxEntry);
    }

    @Override
    public void updateForSource(String sourceType, Long sourceId, String title, String message, String priority) {
        updateForSource(sourceType, sourceId, title, message, priority, List.of(), null);
    }

    @Override
    public void updateForSource(String sourceType, Long sourceId, String title, String message, String priority,
                                List<EmailAttachmentSource> attachmentSources, String revisionToken) {
        String safeTitle = limit(title, 200);
        String safeMessage = limit(message, 1000);
        String safePriority = limit(priority, 20);
        Instant now = Instant.now();
        List<Notification> sourceNotifications = notifications.findBySourceTypeAndSourceId(sourceType, sourceId);
        sourceNotifications.forEach(notification -> {
            notification.setTitle(safeTitle);
            notification.setMessage(safeMessage);
            notification.setPriority(safePriority);
            notification.setUpdatedAt(now);
        });

        if (!"ANNOUNCEMENT".equalsIgnoreCase(sourceType)
                || revisionToken == null || revisionToken.isBlank() || sourceNotifications.isEmpty()) {
            return;
        }

        boolean globallyEnabled = emailNotificationProperties.isGloballyEnabled();
        boolean eventEnabled = emailNotificationProperties.isEventEnabled("ANNOUNCEMENT");
        boolean hasDeliverableRecipient = globallyEnabled && eventEnabled && sourceNotifications.stream()
                .map(Notification::getUser)
                .anyMatch(this::isDeliverableEmailRecipient);

        List<String> attachmentSnapshotIds = List.of();
        if (hasDeliverableRecipient && attachmentSources != null && !attachmentSources.isEmpty()
                && attachmentSnapshotService != null) {
            attachmentSnapshotIds = attachmentSnapshotService.snapshot(attachmentSources);
        }

        for (Notification notification : sourceNotifications) {
            User recipient = notification.getUser();
            if (recipient == null || !recipient.isAccountEnabled() || recipient.isAccountDeleted()
                    || !recipient.isEmailVerified() || recipient.getEmail() == null
                    || recipient.getEmail().isBlank()) {
                continue;
            }

            String deduplicationKey = "ANNOUNCEMENT:" + sourceId + ":REVISION:"
                    + revisionToken + ":" + recipient.getId();
            if (deduplicationKey.length() > 220) {
                throw new IllegalArgumentException("Email outbox deduplication keys must be 220 characters or fewer.");
            }
            if (emailOutbox.existsByDeduplicationKey(deduplicationKey)) {
                continue;
            }

            boolean testEmailAddress = emailNotificationProperties.isTestEmailAddress(recipient.getEmail());
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sourceType", "ANNOUNCEMENT");
            payload.put("userName", recipient.getFullName() == null || recipient.getFullName().isBlank()
                    ? "eVidyalaya user" : recipient.getFullName());
            payload.put("sourceId", sourceId);
            payload.put("title", safeTitle);
            payload.put("message", safeMessage);
            payload.put("category", notification.getCategory());
            payload.put("priority", safePriority);
            payload.put("targetUrl", notification.getTargetUrl());
            payload.put("createdAt", now.toString());
            payload.put("isUpdate", true);
            if (attachmentSnapshotIds != null && !attachmentSnapshotIds.isEmpty()) {
                payload.put("attachmentSnapshotIds", attachmentSnapshotIds);
            }

            emailOutbox.save(EmailNotificationOutbox.builder()
                    .notificationId(notification.getId())
                    .recipientUserId(recipient.getId())
                    .recipientEmail(recipient.getEmail().trim())
                    .templateType("ANNOUNCEMENT")
                    .subject(limit("Updated: " + safeTitle, 200))
                    .payload(payload)
                    .deduplicationKey(deduplicationKey)
                    .status(!testEmailAddress && globallyEnabled && eventEnabled
                            ? EmailNotificationOutboxStatus.PENDING
                            : EmailNotificationOutboxStatus.SKIPPED)
                    .lastError(testEmailAddress
                            ? "TEST_EMAIL_DOMAIN"
                            : (!globallyEnabled
                                    ? "Email notifications are disabled by configuration."
                                    : (!eventEnabled
                                            ? "Email notifications for this event are disabled by configuration."
                                            : null)))
                    .build());
        }
    }

    private boolean isDeliverableEmailRecipient(User recipient) {
        return recipient != null && recipient.isAccountEnabled() && !recipient.isAccountDeleted()
                && recipient.isEmailVerified() && recipient.getEmail() != null
                && !recipient.getEmail().isBlank()
                && !emailNotificationProperties.isTestEmailAddress(recipient.getEmail());
    }

    @Override
    public void deleteForSource(String sourceType, Long sourceId) {
        notifications.deleteAll(notifications.findBySourceTypeAndSourceId(sourceType, sourceId));
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getSourceType(),
                notification.getSourceId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCategory(),
                notification.getPriority(),
                notification.getTargetUrl(),
                notification.getReadAt() != null,
                notification.getReadAt(),
                notification.getCreatedAt());
    }

    private User currentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return users.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private boolean hasRole(User user, RoleName role) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(userRole -> userRole.getName() == role);
    }
}
