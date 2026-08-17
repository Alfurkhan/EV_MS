package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailSenderService {

    private final JavaMailSender mailSender;

    public EmailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(EmailRequest request) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(request.getTo());
        message.setSubject(request.getSubject());

        String body = request.getBodyText();

        if (body == null || body.isBlank()) {
            body = buildEmailBody(request);
        }

        message.setText(body);

        mailSender.send(message);
    }

    private String buildEmailBody(EmailRequest request) {

        String userName = request.getUserName() == null
                ? "User"
                : request.getUserName();

        return switch (request.getEmailType()) {

            case "SIGNUP" ->
                    "Hello " + userName + ",\n\n"
                            + "Welcome to eVidyalaya!\n\n"
                            + "Your account has been successfully created.\n\n"
                            + "Regards,\n"
                            + "eVidyalaya Team";

            case "VERIFY" ->
                    "Hello " + userName + ",\n\n"
                            + "Please verify your email address to continue using eVidyalaya.\n\n"
                            + "Your verification OTP is: " + request.getOtp() + "\n\n"
                            + "This OTP will expire in 10 minutes.\n\n"
                            + "Regards,\n"
                            + "eVidyalaya Team";

            case "FORGOT_PASSWORD" ->
                    "Hello " + userName + ",\n\n"
                            + "We received a request to reset your password.\n\n"
                            + "Regards,\n"
                            + "eVidyalaya Team";

            default ->
                    request.getBodyText() != null
                            ? request.getBodyText()
                            : "";
        };
    }
}