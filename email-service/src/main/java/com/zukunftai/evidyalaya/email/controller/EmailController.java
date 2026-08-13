package com.zukunftai.evidyalaya.email.controller;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import com.zukunftai.evidyalaya.email.service.EmailSenderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email")
public class EmailController {

    private final EmailSenderService emailSenderService;

    public EmailController(EmailSenderService emailSenderService) {
        this.emailSenderService = emailSenderService;
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendEmail(
            @RequestBody EmailRequest request) {

        emailSenderService.sendEmail(request);

        return ResponseEntity.ok().build();
    }
}