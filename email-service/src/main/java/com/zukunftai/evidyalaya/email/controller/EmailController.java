package com.zukunftai.evidyalaya.email.controller;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import com.zukunftai.evidyalaya.email.service.EmailSenderService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;

import java.util.List;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/email")
public class EmailController {

    private static final String SERVICE_KEY_HEADER = "X-Service-Email-Key";

    private final EmailSenderService emailSenderService;
    private final String configuredServiceKey;

    public EmailController(
            EmailSenderService emailSenderService,
            @Value("${email.service.api-key:}") String configuredServiceKey) {
        this.emailSenderService = emailSenderService;
        this.configuredServiceKey = configuredServiceKey;
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendEmail(
            @RequestHeader(value = SERVICE_KEY_HEADER, required = false) String suppliedServiceKey,
            @RequestBody EmailRequest request) {

        if (!isAuthorized(suppliedServiceKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        emailSenderService.sendEmail(request);

        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> sendEmailWithAttachments(
            @RequestHeader(value = SERVICE_KEY_HEADER, required = false) String suppliedServiceKey,
            @RequestPart("request") EmailRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        if (!isAuthorized(suppliedServiceKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        emailSenderService.sendEmail(request, attachments);
        return ResponseEntity.ok().build();
    }

    private boolean isAuthorized(String suppliedServiceKey) {
        if (configuredServiceKey == null || configuredServiceKey.isBlank()
                || suppliedServiceKey == null || suppliedServiceKey.isBlank()) {
            return false;
        }

        return MessageDigest.isEqual(
                configuredServiceKey.getBytes(StandardCharsets.UTF_8),
                suppliedServiceKey.getBytes(StandardCharsets.UTF_8)
        );
    }
}