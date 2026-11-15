package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.ManualNotificationRequest;
import com.zukunftai.evidyalaya.model.EmailAttachmentSource;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.model.NotificationResponse;

import java.util.Collection;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> listForCurrentUser();

    long unreadCount();

    NotificationResponse markRead(Long id);

    void markAllRead();

    NotificationResponse createManualNotification(ManualNotificationRequest request);

    NotificationResponse updateManualNotification(Long id, ManualNotificationRequest request);

    int createForUsers(Collection<User> recipients, NotificationCommand command);

    int createForUsersAndAdmins(Collection<User> recipients, NotificationCommand command);

    void updateForSource(String sourceType, Long sourceId, String title, String message, String priority);

    void updateForSource(String sourceType, Long sourceId, String title, String message, String priority,
                         List<EmailAttachmentSource> attachmentSources, String revisionToken);

    void deleteForSource(String sourceType, Long sourceId);
}
