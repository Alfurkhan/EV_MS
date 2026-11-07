package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.Notification;
import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.model.NotificationResponse;
import com.zukunftai.evidyalaya.repository.NotificationRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    void addsEnabledAdminsToFacultyActivityAndKeepsRecipientDeduplication() {
        User student = User.builder().id(401L).build();
        User admin = User.builder().id(402L).accountEnabled(true).accountDeleted(false)
                .roles(Set.of(new Role(1L, RoleName.ROLE_ADMIN))).build();
        User disabledAdmin = User.builder().id(403L).accountEnabled(false).accountDeleted(false)
                .roles(Set.of(new Role(2L, RoleName.ROLE_ADMIN))).build();
        User deletedAdmin = User.builder().id(404L).accountEnabled(true).accountDeleted(true)
                .roles(Set.of(new Role(3L, RoleName.ROLE_ADMIN))).build();
        NotificationCommand command = new NotificationCommand(
                "ASSESSMENT", 88L, "Assessment published", "A faculty member published an assessment.",
                "ASSESSMENTS", "NORMAL", "/assessments", "ASSESSMENT:88");
        when(userRepository.findAll()).thenReturn(List.of(admin, disabledAdmin, deletedAdmin));
        when(notificationRepository.existsByDeduplicationKey(anyString())).thenReturn(false);
        int created = notificationService.createForUsersAndAdmins(List.of(student, admin), command);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        assertEquals(2, created);
        assertEquals(List.of("ASSESSMENT:88:401", "ASSESSMENT:88:402"),
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

    @Test
    void returnsReadAndUnreadNotificationsInTheCompleteUserHistory() {
        User currentUser = User.builder().id(501L).username("admin").build();
        Instant createdAt = Instant.parse("2026-11-05T08:00:00Z");
        Notification previouslyRead = Notification.builder()
                .id(1L).user(currentUser).sourceType("MANUAL")
                .title("Earlier update").message("This notification was already read.")
                .category("GENERAL").priority("NORMAL")
                .readAt(LocalDateTime.parse("2026-11-05T13:00:00"))
                .createdAt(createdAt).updatedAt(createdAt).build();
        Notification unread = Notification.builder()
                .id(2L).user(currentUser).sourceType("MANUAL")
                .title("Latest update").message("This notification is still unread.")
                .category("GENERAL").priority("IMPORTANT")
                .createdAt(createdAt.plusSeconds(60))
                .updatedAt(createdAt.plusSeconds(60)).build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", "test", List.of()));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(currentUser));
        when(notificationRepository.findByUserOrderByCreatedAtDesc(currentUser))
                .thenReturn(List.of(unread, previouslyRead));

        try {
            List<NotificationResponse> result = notificationService.listForCurrentUser();

            assertEquals(2, result.size());
            assertFalse(result.get(0).read());
            assertTrue(result.get(1).read());
            assertEquals(1L, result.get(1).id());
            verify(notificationRepository).findByUserOrderByCreatedAtDesc(currentUser);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

}
