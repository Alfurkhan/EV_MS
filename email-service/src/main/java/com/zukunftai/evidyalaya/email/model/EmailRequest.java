package com.zukunftai.evidyalaya.email.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {

    private String subject;
    private String bodyText;
    private String to;
    private String emailType;
    private String userName;
    private String otp;
}