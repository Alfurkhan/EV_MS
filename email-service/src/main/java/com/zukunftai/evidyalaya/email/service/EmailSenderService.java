package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailSenderService {

    private final JavaMailSender mailSender;
    private final EmailTemplateRenderer templateRenderer;

    public EmailSenderService(JavaMailSender mailSender, EmailTemplateRenderer templateRenderer) {
        this.mailSender = mailSender;
        this.templateRenderer = templateRenderer;
    }

    public void sendEmail(EmailRequest request) {
        EmailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(request);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());
            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject() == null || request.getSubject().isBlank()
                    ? "A message from eVidyalaya" : request.getSubject());
            helper.setText(rendered.plainText(), rendered.html());
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Unable to create eVidyalaya email message.", exception);
        }
    }
}