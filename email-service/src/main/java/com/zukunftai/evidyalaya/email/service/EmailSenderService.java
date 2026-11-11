package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class EmailSenderService {

    private static final int MAX_ATTACHMENTS = 5;
    private static final long MAX_ATTACHMENT_BYTES = 25L * 1024 * 1024;

    private final JavaMailSender mailSender;
    private final EmailTemplateRenderer templateRenderer;

    public EmailSenderService(JavaMailSender mailSender, EmailTemplateRenderer templateRenderer) {
        this.mailSender = mailSender;
        this.templateRenderer = templateRenderer;
    }

    public void sendEmail(EmailRequest request) {
        sendEmail(request, List.of());
    }

    public void sendEmail(EmailRequest request, List<MultipartFile> attachments) {
        EmailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(request);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());
            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject() == null || request.getSubject().isBlank()
                    ? "A message from eVidyalaya" : request.getSubject());
            helper.setText(rendered.plainText(), rendered.html());
            addAttachments(helper, attachments);
            mailSender.send(message);
        } catch (MessagingException | IOException exception) {
            throw new IllegalStateException("Unable to create eVidyalaya email message.", exception);
        }
    }

    private void addAttachments(MimeMessageHelper helper, List<MultipartFile> attachments)
            throws MessagingException, IOException {
        if (attachments == null || attachments.isEmpty()) return;
        if (attachments.size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("An email can contain at most five attachments.");
        }

        long totalBytes = 0;
        for (MultipartFile attachment : attachments) {
            if (attachment == null || attachment.isEmpty()) {
                throw new IllegalArgumentException("Email attachment content is missing.");
            }
            String fileName = safeFileName(attachment.getOriginalFilename());
            long size = attachment.getSize();
            if (size <= 0 || size > MAX_ATTACHMENT_BYTES) {
                throw new IllegalArgumentException("Each email attachment must be between 1 byte and 25 MB.");
            }
            totalBytes += size;
            if (totalBytes > MAX_ATTACHMENT_BYTES) {
                throw new IllegalArgumentException("The combined email attachments cannot exceed 25 MB.");
            }

            String contentType = attachment.getContentType();
            if (contentType == null || contentType.isBlank()
                    || contentType.indexOf('\r') >= 0 || contentType.indexOf('\n') >= 0) {
                contentType = "application/octet-stream";
            }
            helper.addAttachment(fileName, new ByteArrayDataSource(attachment.getBytes(), contentType));
        }
    }

    private String safeFileName(String suppliedName) {
        if (suppliedName == null || suppliedName.isBlank()) {
            throw new IllegalArgumentException("Email attachment filename is required.");
        }
        String fileName = suppliedName.trim();
        if (fileName.isBlank() || fileName.equals(".") || fileName.equals("..")
                || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")
                || fileName.length() > 255
                || fileName.indexOf('\r') >= 0 || fileName.indexOf('\n') >= 0) {
            throw new IllegalArgumentException("Email attachment filename is invalid.");
        }
        return fileName;
    }
}
