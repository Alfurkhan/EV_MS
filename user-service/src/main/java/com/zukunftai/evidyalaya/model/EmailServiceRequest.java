package com.zukunftai.evidyalaya.model;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailServiceRequest {
    private String subject;
    private String bodyText;
    private String to;
    @Enumerated(EnumType.STRING)
    private EmailType emailType;
    private String userName;
}
