package com.zukunftai.evidyalaya.service.email;

import com.zukunftai.evidyalaya.database.EmailNotificationAttachmentSnapshot;
import com.zukunftai.evidyalaya.model.EmailAttachmentSource;
import com.zukunftai.evidyalaya.repository.EmailNotificationAttachmentSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EmailAttachmentSnapshotService {
    private static final int MAX_ATTACHMENTS = 5;
    private static final long MAX_FILE_BYTES = 25L * 1024 * 1024;

    private final EmailNotificationAttachmentSnapshotRepository repository;

    public EmailAttachmentSnapshotService(EmailNotificationAttachmentSnapshotRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<String> snapshot(List<EmailAttachmentSource> sources) {
        if (sources == null || sources.isEmpty()) return List.of();
        if (sources.size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("An email event can contain at most five attachments.");
        }

        List<EmailNotificationAttachmentSnapshot> snapshots = new ArrayList<>();
        long totalBytes = 0;
        for (EmailAttachmentSource source : sources) {
            if (source == null || source.storedPath() == null || source.storedPath().isBlank()) {
                throw new IllegalArgumentException("Email attachment source is missing.");
            }
            Path path = Path.of(source.storedPath()).toAbsolutePath().normalize();
            try {
                if (!Files.isRegularFile(path)) {
                    throw new IllegalStateException("An attachment selected for email delivery no longer exists.");
                }
                long size = Files.size(path);
                if (size <= 0 || size > MAX_FILE_BYTES) {
                    throw new IllegalArgumentException("Each email attachment must be between 1 byte and 25 MB.");
                }
                totalBytes += size;
                if (totalBytes > MAX_FILE_BYTES) {
                    throw new IllegalArgumentException("The combined email attachments cannot exceed 25 MB.");
                }
                byte[] content = Files.readAllBytes(path);
                if (content.length != size) {
                    throw new IllegalStateException("An attachment changed while its email snapshot was being created.");
                }

                String fileName = safeFileName(source.fileName());
                String contentType = safeContentType(source.contentType());
                UUID id = UUID.randomUUID();
                snapshots.add(EmailNotificationAttachmentSnapshot.builder()
                        .id(id)
                        .fileName(fileName)
                        .contentType(contentType)
                        .content(content)
                        .fileSize(content.length)
                        .build());
            } catch (IOException exception) {
                throw new IllegalStateException("Could not create a durable email attachment snapshot.", exception);
            }
        }
        repository.saveAll(snapshots);
        return snapshots.stream().map(snapshot -> snapshot.getId().toString()).toList();
    }

    private String safeFileName(String supplied) {
        if (supplied == null || supplied.isBlank()) {
            throw new IllegalArgumentException("Email attachment filename is required.");
        }
        String name = supplied.trim();
        if (name.isBlank() || name.equals(".") || name.equals("..") || name.contains("..")
                || name.contains("/") || name.contains("\\")
                || name.length() > 255 || name.indexOf((char) 13) >= 0 || name.indexOf((char) 10) >= 0) {
            throw new IllegalArgumentException("Email attachment filename is invalid.");
        }
        return name;
    }

    private String safeContentType(String supplied) {
        if (supplied == null || supplied.isBlank()
                || supplied.indexOf((char) 13) >= 0 || supplied.indexOf((char) 10) >= 0) {
            return "application/octet-stream";
        }
        return supplied;
    }
}
