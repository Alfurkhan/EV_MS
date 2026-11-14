package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.config.EmailNotificationProperties;
import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import com.zukunftai.evidyalaya.database.EmailNotificationOutboxStatus;
import com.zukunftai.evidyalaya.database.Notification;
import com.zukunftai.evidyalaya.database.Role;
import com.zukunftai.evidyalaya.database.RoleName;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.model.NotificationCommand;
import com.zukunftai.evidyalaya.model.EmailAttachmentSource;
import com.zukunftai.evidyalaya.service.email.EmailAttachmentSnapshotService;
import com.zukunftai.evidyalaya.model.NotificationResponse;
import com.zukunftai.evidyalaya.repository.EmailNotificationOutboxRepository;
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
import java.util.Map;
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

    @Mock
    private EmailNotificationOutboxRepository emailOutboxRepository;

    @Mock
    private EmailAttachmentSnapshotService attachmentSnapshotService;

    @Mock
    private EmailNotificationProperties emailNotificationProperties;

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


    @Test
    void queuesAnEmailSnapshotForAnEligibleOptedInRecipient() {
        User recipient = User.builder()
                .id(601L)
                .email("student@example.com")
                .emailVerified(true)
                .accountEnabled(true)
                .accountDeleted(false)
                .build();
        NotificationCommand command = new NotificationCommand(
                "ANNOUNCEMENT", 901L, "School update", "The school will reopen on Monday.",
                "ANNOUNCEMENTS", "NORMAL", "/announcements", "ANNOUNCEMENT:901", true);

        when(notificationRepository.existsByDeduplicationKey("ANNOUNCEMENT:901:601")).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(7001L);
            return saved;
        });
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("ANNOUNCEMENT")).thenReturn(true);

        int created = notificationService.createForUsers(List.of(recipient), command);

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(emailOutboxRepository).save(captor.capture());
        EmailNotificationOutbox queued = captor.getValue();

        assertEquals(1, created);
        assertEquals(7001L, queued.getNotificationId());
        assertEquals(601L, queued.getRecipientUserId());
        assertEquals("student@example.com", queued.getRecipientEmail());
        assertEquals("ANNOUNCEMENT", queued.getTemplateType());
        assertEquals("School update", queued.getSubject());
        assertEquals(EmailNotificationOutboxStatus.PENDING, queued.getStatus());
        assertEquals("The school will reopen on Monday.", queued.getPayload().get("message"));
        assertEquals("/announcements", queued.getPayload().get("targetUrl"));
    }

    @Test
    void reusesOneImmutableAttachmentSnapshotReferenceAcrossRecipientOutboxEntries() {
        User first = User.builder().id(621L).email("first@example.com")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        User second = User.builder().id(622L).email("second@example.com")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        NotificationCommand command = new NotificationCommand(
                "ANNOUNCEMENT", 911L, "School notice", "Please read the attached notice.",
                "ANNOUNCEMENTS", "NORMAL", "/announcements", "ANNOUNCEMENT:911", true,
                Map.of(), List.of(new EmailAttachmentSource(
                        "C:/evidyalaya/uploads/notice.pdf", "notice.pdf", "application/pdf")));

        when(notificationRepository.existsByDeduplicationKey(anyString())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(7200L + saved.getUser().getId());
            return saved;
        });
        when(emailNotificationProperties.isTestEmailAddress(anyString())).thenReturn(false);
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("ANNOUNCEMENT")).thenReturn(true);
        when(attachmentSnapshotService.snapshot(command.attachmentSources()))
                .thenReturn(List.of("d5e7bfa1-2b9a-4e89-9f40-2df3f25d91a1"));

        notificationService.createForUsers(List.of(first, second), command);

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(attachmentSnapshotService, times(1)).snapshot(command.attachmentSources());
        verify(emailOutboxRepository, times(2)).save(captor.capture());
        assertEquals(List.of("d5e7bfa1-2b9a-4e89-9f40-2df3f25d91a1"),
                captor.getAllValues().get(0).getPayload().get("attachmentSnapshotIds"));
        assertEquals(List.of("d5e7bfa1-2b9a-4e89-9f40-2df3f25d91a1"),
                captor.getAllValues().get(1).getPayload().get("attachmentSnapshotIds"));
    }

    @Test
    void storesOnlyTheMatchingStudentsResultDataInEachEmailOutboxEntry() {
        User first = User.builder().id(611L).email("first@example.com")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        User second = User.builder().id(612L).email("second@example.com")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        NotificationCommand command = new NotificationCommand(
                "RESULT", 910L, "Assessment results published", "Your results are available.",
                "RESULTS", "NORMAL", "/my-assessments", "RESULT:910", true,
                Map.of(
                        611L, Map.of("resultScore", "8.00", "resultTotalMarks", "10.00"),
                        612L, Map.of("resultScore", "5.00", "resultTotalMarks", "10.00")
                ));

        when(notificationRepository.existsByDeduplicationKey(anyString())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(7100L + saved.getUser().getId());
            return saved;
        });
        when(emailNotificationProperties.isTestEmailAddress(anyString())).thenReturn(false);
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("RESULT")).thenReturn(true);

        notificationService.createForUsers(List.of(first, second), command);

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(emailOutboxRepository, times(2)).save(captor.capture());
        Map<Long, EmailNotificationOutbox> byRecipient = captor.getAllValues().stream()
                .collect(java.util.stream.Collectors.toMap(
                        EmailNotificationOutbox::getRecipientUserId, entry -> entry));
        assertEquals("8.00", byRecipient.get(611L).getPayload().get("resultScore"));
        assertEquals("5.00", byRecipient.get(612L).getPayload().get("resultScore"));
        assertEquals("10.00", byRecipient.get(611L).getPayload().get("resultTotalMarks"));
        assertEquals("10.00", byRecipient.get(612L).getPayload().get("resultTotalMarks"));
    }

    @Test
    void doesNotQueueEmailForRecipientsWhoHaveNotVerifiedTheirEmail() {
        User recipient = User.builder()
                .id(602L)
                .email("student@example.com")
                .emailVerified(false)
                .accountEnabled(true)
                .accountDeleted(false)
                .build();
        NotificationCommand command = new NotificationCommand(
                "ASSIGNMENT", 902L, "New assignment", "A new assignment is available.",
                "ASSIGNMENTS", "NORMAL", "/assignments", "ASSIGNMENT:902", true);

        when(notificationRepository.existsByDeduplicationKey("ASSIGNMENT:902:602")).thenReturn(false);

        int created = notificationService.createForUsers(List.of(recipient), command);

        assertEquals(1, created);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailOutboxRepository, never()).save(any(EmailNotificationOutbox.class));
    }

    @Test
    void doesNotQueueWorkflowOnlyTimetableNotifications() {
        User recipient = User.builder()
                .id(603L)
                .email("faculty@example.com")
                .emailVerified(true)
                .accountEnabled(true)
                .accountDeleted(false)
                .build();
        NotificationCommand approvalRequest = new NotificationCommand(
                "TIMETABLE", 903L, "Timetable awaiting approval", "A timetable needs review.",
                "TIMETABLES", "NORMAL", "/timetable", "TIMETABLE:903:SUBMITTED");

        when(notificationRepository.existsByDeduplicationKey("TIMETABLE:903:SUBMITTED:603"))
                .thenReturn(false);

        int created = notificationService.createForUsers(List.of(recipient), approvalRequest);

        assertEquals(1, created);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailOutboxRepository, never()).save(any(EmailNotificationOutbox.class));
    }


    @Test
    void skipsConfiguredTestEmailDomainsWithoutAffectingInAppNotifications() {
        User recipient = User.builder()
                .id(605L)
                .email("student@zsmail.com")
                .emailVerified(true)
                .accountEnabled(true)
                .accountDeleted(false)
                .build();
        NotificationCommand command = new NotificationCommand(
                "ANNOUNCEMENT", 905L, "School update", "The school will reopen on Monday.",
                "ANNOUNCEMENTS", "NORMAL", "/announcements", "ANNOUNCEMENT:905", true);

        when(notificationRepository.existsByDeduplicationKey("ANNOUNCEMENT:905:605")).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(7005L);
            return saved;
        });
        when(emailNotificationProperties.isTestEmailAddress("student@zsmail.com")).thenReturn(true);
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("ANNOUNCEMENT")).thenReturn(true);

        int created = notificationService.createForUsers(List.of(recipient), command);

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailOutboxRepository).save(captor.capture());
        assertEquals(1, created);
        assertEquals(EmailNotificationOutboxStatus.SKIPPED, captor.getValue().getStatus());
        assertEquals("TEST_EMAIL_DOMAIN", captor.getValue().getLastError());
        assertEquals("student@zsmail.com", captor.getValue().getRecipientEmail());
    }

    @Test
    void recordsSkippedEmailWhenAnEventCategoryIsDisabled() {
        User recipient = User.builder()
                .id(604L)
                .email("student@example.com")
                .emailVerified(true)
                .accountEnabled(true)
                .accountDeleted(false)
                .build();
        NotificationCommand command = new NotificationCommand(
                "RESULT", 904L, "Results published", "Your results are available.",
                "RESULTS", "NORMAL", "/my-assessments", "RESULT:904", true);

        when(notificationRepository.existsByDeduplicationKey("RESULT:904:604")).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(7004L);
            return saved;
        });
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("RESULT")).thenReturn(false);

        notificationService.createForUsers(List.of(recipient), command);

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(emailOutboxRepository).save(captor.capture());
        assertEquals(EmailNotificationOutboxStatus.SKIPPED, captor.getValue().getStatus());
        assertEquals(
                "Email notifications for this event are disabled by configuration.",
                captor.getValue().getLastError());
    }

    @Test
    void queuesOneRevisionEmailPerExistingRecipientWithoutCreatingDuplicateInAppNotifications() {
        User first = User.builder().id(631L).email("first@example.com").fullName("First Student")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        User second = User.builder().id(632L).email("second@example.com").fullName("Second Student")
                .emailVerified(true).accountEnabled(true).accountDeleted(false).build();
        Notification firstNotification = Notification.builder().id(8301L).user(first)
                .sourceType("ANNOUNCEMENT").sourceId(912L).title("Updated notice")
                .message("The revised details are here.").category("ANNOUNCEMENTS")
                .priority("IMPORTANT").targetUrl("/announcements").build();
        Notification secondNotification = Notification.builder().id(8302L).user(second)
                .sourceType("ANNOUNCEMENT").sourceId(912L).title("Updated notice")
                .message("The revised details are here.").category("ANNOUNCEMENTS")
                .priority("IMPORTANT").targetUrl("/announcements").build();
        List<EmailAttachmentSource> sources = List.of(
                new EmailAttachmentSource("C:/uploads/revised.pdf", "revised.pdf", "application/pdf"));

        when(notificationRepository.findBySourceTypeAndSourceId("ANNOUNCEMENT", 912L))
                .thenReturn(List.of(firstNotification, secondNotification));
        when(emailNotificationProperties.isGloballyEnabled()).thenReturn(true);
        when(emailNotificationProperties.isEventEnabled("ANNOUNCEMENT")).thenReturn(true);
        when(emailNotificationProperties.isTestEmailAddress(anyString())).thenReturn(false);
        when(emailOutboxRepository.existsByDeduplicationKey(anyString())).thenReturn(false);
        when(attachmentSnapshotService.snapshot(sources)).thenReturn(List.of("snapshot-revision-1"));

        notificationService.updateForSource("ANNOUNCEMENT", 912L, "Updated notice",
                "The revised details are here.", "IMPORTANT", sources, "2026-11-11T10:00:00Z");

        ArgumentCaptor<EmailNotificationOutbox> captor =
                ArgumentCaptor.forClass(EmailNotificationOutbox.class);
        verify(emailOutboxRepository, times(2)).save(captor.capture());
        verify(attachmentSnapshotService, times(1)).snapshot(sources);
        verify(notificationRepository, never()).save(any(Notification.class));
        assertEquals(List.of("first@example.com", "second@example.com"),
                captor.getAllValues().stream().map(EmailNotificationOutbox::getRecipientEmail).toList());
        assertEquals(List.of(8301L, 8302L),
                captor.getAllValues().stream().map(EmailNotificationOutbox::getNotificationId).toList());
        assertTrue(captor.getAllValues().stream()
                .allMatch(entry -> entry.getDeduplicationKey().contains(":REVISION:")));
        assertTrue(captor.getAllValues().stream()
                .allMatch(entry -> entry.getSubject().equals("Updated: Updated notice")));
        assertTrue(captor.getAllValues().stream()
                .allMatch(entry -> entry.getPayload().get("isUpdate").equals(true)));
        assertTrue(captor.getAllValues().stream()
                .allMatch(entry -> entry.getPayload().get("attachmentSnapshotIds")
                        .equals(List.of("snapshot-revision-1"))));
    }

}
