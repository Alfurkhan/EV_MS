package com.zukunftai.evidyalaya.email.controller;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import com.zukunftai.evidyalaya.email.service.EmailSenderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailControllerTest {

    @Mock
    private EmailSenderService emailSenderService;

    @Test
    void sendEmailRejectsMissingServiceKey() {
        EmailController controller = new EmailController(emailSenderService, "configured-secret");

        ResponseEntity<Void> response =
                controller.sendEmail(null, new EmailRequest());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(emailSenderService);
    }

    @Test
    void sendEmailRejectsIncorrectServiceKey() {
        EmailController controller = new EmailController(emailSenderService, "configured-secret");

        ResponseEntity<Void> response =
                controller.sendEmail("incorrect-secret", new EmailRequest());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(emailSenderService);
    }

    @Test
    void sendEmailRejectsRequestsWhenServiceKeyIsNotConfigured() {
        EmailController controller = new EmailController(emailSenderService, "");

        ResponseEntity<Void> response =
                controller.sendEmail("any-supplied-secret", new EmailRequest());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(emailSenderService);
    }

    @Test
    void sendEmailAcceptsMatchingServiceKey() {
        EmailController controller = new EmailController(emailSenderService, "configured-secret");
        EmailRequest request = new EmailRequest();

        ResponseEntity<Void> response =
                controller.sendEmail("configured-secret", request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(emailSenderService).sendEmail(request);
    }
}
