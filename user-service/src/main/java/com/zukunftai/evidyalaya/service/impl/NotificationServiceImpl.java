package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Notification;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.ManualNotificationRequest;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.model.NotificationResponse;
import com.zukunftai.evidyalaya.repository.NotificationRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    private final NotificationRepository notifications;
    private final UserRepository users;

    public NotificationServiceImpl(NotificationRepository notifications, UserRepository users) {
        this.notifications = notifications;
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> listForCurrentUser() {
        User user = currentUser();
        return notifications.findTop100ByUserOrderByCreatedAtDesc(user)
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

        int created = 0;
        Instant now = Instant.now();
        for (User recipient : uniqueRecipients.values()) {
            String deduplicationKey = command.deduplicationKeyPrefix() == null
                    || command.deduplicationKeyPrefix().isBlank()
                    ? null
                    : command.deduplicationKeyPrefix() + ":" + recipient.getId();

            if (deduplicationKey != null && notifications.existsByDeduplicationKey(deduplicationKey)) {
                continue;
            }

            Notification notification = Notification.builder()
                    .user(recipient)
                    .sourceType(command.sourceType())
                    .sourceId(command.sourceId())
                    .title(command.title())
                    .message(command.message())
                    .category(command.category())
                    .priority(command.priority())
                    .targetUrl(command.targetUrl())
                    .deduplicationKey(deduplicationKey)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            notifications.save(notification);
            created++;
        }
        return created;
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
