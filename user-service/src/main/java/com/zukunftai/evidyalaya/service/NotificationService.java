package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.ManualNotificationRequest;
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
}
