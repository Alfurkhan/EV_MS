package com.zukunftai.evidyalaya.model;

/**
 * Internal reference to a feature-owned file that must be snapshotted for
 * durable email delivery. The path is never sent to the email service.
 */
public record EmailAttachmentSource(String storedPath, String fileName, String contentType) {
}
