package com.zukunftai.evidyalaya.model;

import java.time.Instant;

public record AnnouncementAttachmentResponse(
        Long id,
        String fileName,
        String contentType,
        long fileSize,
        Instant uploadedAt,
        String downloadUrl
) {}
