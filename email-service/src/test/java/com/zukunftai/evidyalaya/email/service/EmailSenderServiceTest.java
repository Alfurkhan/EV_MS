package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailSenderServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendsEmailWithBinaryAttachmentAsMimePart() throws Exception {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailRequest request = new EmailRequest(
                "Assignment published", "Please find the assignment attached.",
                "student@example.com", "ASSIGNMENT", "Student", null);
        MockMultipartFile attachment = new MockMultipartFile(
                "attachments", "worksheet.txt", "text/plain",
                "Complete questions 1-5".getBytes());

        service.sendEmail(request, List.of(attachment));

        verify(mailSender).send(message);
        Object content = message.getContent();
        assertInstanceOf(Multipart.class, content);
        Multipart multipart = (Multipart) content;
        assertEquals(2, multipart.getCount());
        assertEquals("worksheet.txt", multipart.getBodyPart(1).getFileName());
        assertEquals("Complete questions 1-5",
                new String(multipart.getBodyPart(1).getInputStream().readAllBytes()));
    }

    @Test
    void rejectsUnsafeAttachmentFileNamesWithoutSendingEmail() {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        EmailRequest request = new EmailRequest(
                "Notice", "Message", "student@example.com", "ANNOUNCEMENT", "Student", null);
        MockMultipartFile attachment = new MockMultipartFile(
                "attachments", "../private.txt", "text/plain", "private".getBytes());

        assertThrows(IllegalArgumentException.class, () -> service.sendEmail(request, List.of(attachment)));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void rejectsCombinedAttachmentsOver25MbWithoutSendingEmail() {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        EmailRequest request = new EmailRequest(
                "Notice", "Message", "student@example.com", "ANNOUNCEMENT", "Student", null);
        MockMultipartFile first = new MockMultipartFile(
                "attachments", "first.bin", "application/octet-stream", new byte[13 * 1024 * 1024]);
        MockMultipartFile second = new MockMultipartFile(
                "attachments", "second.bin", "application/octet-stream", new byte[13 * 1024 * 1024]);

        assertThrows(IllegalArgumentException.class,
                () -> service.sendEmail(request, List.of(first, second)));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void keepsExistingEmailsWithoutAttachmentsWorking() {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        EmailRequest request = new EmailRequest(
                "Verification", "Your code is 123456.", "student@example.com", "TEST", "Student", null);

        assertDoesNotThrow(() -> service.sendEmail(request));
        verify(mailSender).send(message);
    }
}
