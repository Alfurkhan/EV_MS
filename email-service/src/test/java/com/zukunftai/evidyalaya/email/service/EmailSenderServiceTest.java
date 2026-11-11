package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailAttachment;
import com.zukunftai.evidyalaya.email.model.EmailRequest;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Base64;
import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailSenderServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendsEmailWithDecodedAttachmentAsMimePart() throws Exception {
        EmailTemplateRenderer renderer = new EmailTemplateRenderer();
        EmailSenderService service = new EmailSenderService(mailSender, renderer);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailRequest request = new EmailRequest(
                "Assignment published", "Please find the assignment attached.",
                "student@example.com", "ASSIGNMENT", "Student", null);
        request.setAttachments(List.of(new EmailAttachment(
                "worksheet.txt", "text/plain",
                Base64.getEncoder().encodeToString("Complete questions 1-5".getBytes()))));

        service.sendEmail(request);

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
    void rejectsInvalidBase64WithoutSendingEmail() {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        EmailRequest request = new EmailRequest(
                "Notice", "Message", "student@example.com", "ANNOUNCEMENT", "Student", null);
        request.setAttachments(List.of(new EmailAttachment("notice.pdf", "application/pdf", "%%%")));

        assertThrows(IllegalArgumentException.class, () -> service.sendEmail(request));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void rejectsUnsafeAttachmentFileNames() {
        EmailSenderService service = new EmailSenderService(mailSender, new EmailTemplateRenderer());
        EmailRequest request = new EmailRequest(
                "Notice", "Message", "student@example.com", "ANNOUNCEMENT", "Student", null);
        request.setAttachments(List.of(new EmailAttachment(
                "../private.txt", "text/plain",
                Base64.getEncoder().encodeToString("private".getBytes()))));

        assertThrows(IllegalArgumentException.class, () -> service.sendEmail(request));
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
