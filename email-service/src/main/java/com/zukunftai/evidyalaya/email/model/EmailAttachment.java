package com.zukunftai.evidyalaya.email.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal service-to-service attachment payload. Content is Base64 encoded
 * so the authenticated email-service endpoint can receive it over JSON.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailAttachment {
    private String fileName;
    private String contentType;
    private String contentBase64;
}
