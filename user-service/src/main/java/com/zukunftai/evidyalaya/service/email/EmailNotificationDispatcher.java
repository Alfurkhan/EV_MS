package com.zukunftai.evidyalaya.service.email;

import com.zukunftai.evidyalaya.database.EmailNotificationOutbox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class EmailNotificationDispatcher {
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationDispatcher.class);

    private final EmailNotificationClaimService claimService;
    private final EmailNotificationStateService stateService;
    private final RestTemplate restTemplate;
    private final String emailServiceUrl;
    private final String serviceApiKey;
    private final boolean enabled;
    private final int batchSize;
    private final Duration leaseDuration;
    private final int maxAttempts;

    public EmailNotificationDispatcher(
            EmailNotificationClaimService claimService,
            EmailNotificationStateService stateService,
            RestTemplate restTemplate,
            @Value("${service.api.emailService}") String emailServiceUrl,
            @Value("${EMAIL_SERVICE_API_KEY:}") String serviceApiKey,
            @Value("${email.notifications.dispatcher.enabled:true}") boolean enabled,
            @Value("${email.notifications.dispatcher.batch-size:25}") int batchSize,
            @Value("${email.notifications.dispatcher.lease-seconds:180}") long leaseSeconds,
            @Value("${email.notifications.dispatcher.max-attempts:5}") int maxAttempts) {
        this.claimService = claimService;
        this.stateService = stateService;
        this.restTemplate = restTemplate;
        this.emailServiceUrl = emailServiceUrl;
        this.serviceApiKey = serviceApiKey;
        this.enabled = enabled;
        this.batchSize = Math.max(1, batchSize);
        this.leaseDuration = Duration.ofSeconds(Math.max(30, leaseSeconds));
        this.maxAttempts = Math.max(1, Math.min(5, maxAttempts));
    }

    @Scheduled(fixedDelayString = "${email.notifications.dispatcher.fixed-delay-ms:5000}")
    public void dispatchDueEmails() {
        if (!enabled) return;
        if (serviceApiKey == null || serviceApiKey.isBlank()) {
            log.warn("Email notification dispatcher is enabled but EMAIL_SERVICE_API_KEY is not configured.");
            return;
        }
        for (EmailNotificationOutbox outbox : claimService.claimDue(batchSize, leaseDuration)) {
            dispatchOne(outbox);
        }
    }

    private void dispatchOne(EmailNotificationOutbox outbox) {
        int attemptNumber = outbox.getAttempts();
        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("subject", outbox.getSubject());
            request.put("bodyText", outbox.getPayload().getOrDefault("message", ""));
            request.put("to", outbox.getRecipientEmail());
            request.put("emailType", outbox.getTemplateType());
            request.put("userName", outbox.getPayload().getOrDefault("userName", "eVidyalaya user"));
            request.put("templateData", outbox.getPayload());
            Object attachments = outbox.getPayload().get("attachments");
            if (attachments != null) request.put("attachments", attachments);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Email-Key", serviceApiKey);
            restTemplate.exchange(emailServiceUrl, HttpMethod.POST,
                    new HttpEntity<>(request, headers), Void.class);
            stateService.markSent(outbox.getId(), attemptNumber);
        } catch (HttpStatusCodeException exception) {
            int status = exception.getStatusCode().value();
            boolean retryable = status == 408 || status == 429 || status >= 500;
            recordFailure(outbox, attemptNumber, retryable, exception.getMessage());
        } catch (RestClientException exception) {
            recordFailure(outbox, attemptNumber, true, exception.getMessage());
        } catch (RuntimeException exception) {
            recordFailure(outbox, attemptNumber, true, exception.getMessage());
        }
    }

    private void recordFailure(EmailNotificationOutbox outbox, int attemptNumber,
                               boolean retryable, String message) {
        stateService.markFailure(outbox.getId(), attemptNumber, retryable, maxAttempts, message);
        log.warn("Email notification {} attempt {} failed; retryable={}",
                outbox.getId(), attemptNumber, retryable && attemptNumber < maxAttempts);
    }
}
