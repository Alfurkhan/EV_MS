package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Notification;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.repository.NotificationRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void createsOneNotificationPerUniqueRecipientWithStableDeduplicationKeys() {
        User first = User.builder().id(101L).build();
        User second = User.builder().id(202L).build();
        NotificationCommand command = new NotificationCommand(
                "ASSIGNMENT", 55L, "New assignment", "An assignment is available.",
                "ASSIGNMENTS", "NORMAL", "/assignments", "ASSIGNMENT:55");

        when(notificationRepository.existsByDeduplicationKey(anyString())).thenReturn(false);

        int created = notificationService.createForUsers(
                List.of(first, second, first), command);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        assertEquals(2, created);
        assertEquals(List.of("ASSIGNMENT:55:101", "ASSIGNMENT:55:202"),
                captor.getAllValues().stream().map(Notification::getDeduplicationKey).toList());
    }

    @Test
    void skipsNotificationsThatWereAlreadyDelivered() {
        User recipient = User.builder().id(303L).build();
        NotificationCommand command = new NotificationCommand(
                "ASSESSMENT", 77L, "Assessment published", "An assessment is available.",
                "ASSESSMENTS", "NORMAL", "/my-assessments", "ASSESSMENT:77");

        when(notificationRepository.existsByDeduplicationKey("ASSESSMENT:77:303")).thenReturn(true);

        int created = notificationService.createForUsers(List.of(recipient), command);

        assertEquals(0, created);
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
