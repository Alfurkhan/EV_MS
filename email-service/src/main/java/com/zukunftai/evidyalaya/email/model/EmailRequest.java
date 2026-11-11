package com.zukunftai.evidyalaya.email.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class EmailRequest {

    private String subject;
    private String bodyText;
    private String to;
    private String emailType;
    private String userName;
    private String otp;
    private Map<String, Object> templateData;
    private List<EmailAttachment> attachments;

    /**
     * Retains the original constructor signature used by existing OTP/signup callers and tests.
     */
    public EmailRequest(String subject, String bodyText, String to, String emailType,
                        String userName, String otp) {
        this.subject = subject;
        this.bodyText = bodyText;
        this.to = to;
        this.emailType = emailType;
        this.userName = userName;
        this.otp = otp;
    }
}
