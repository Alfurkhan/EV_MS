package com.zukunftai.evidyalaya.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipFile;

@Service
public class AnnouncementAttachmentStorageService {
    public static final long MAX_FILE_BYTES = 25L * 1024 * 1024;

    private static final Map<String, String> CONTENT_TYPES = Map.of(
            ".pdf", "application/pdf",
            ".jpg", "image/jpeg",
            ".jpeg", "image/jpeg",
            ".png", "image/png",
            ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt", "text/plain"
    );

    private final Path storageRoot;

    public AnnouncementAttachmentStorageService(
            @Value("${app.announcement-storage-dir:uploads/announcements}") String storageDirectory) {
        this.storageRoot = Paths.get(storageDirectory).toAbsolutePath().normalize();
    }

    public StoredFile store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw badRequest("Choose a non-empty attachment.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Each announcement attachment must be 25 MB or smaller.");
        }

        String originalName = safeOriginalName(file.getOriginalFilename());
        int dot = originalName.lastIndexOf('.');
        String extension = dot < 0 ? "" : originalName.substring(dot).toLowerCase(Locale.ROOT);
        String contentType = CONTENT_TYPES.get(extension);
        if (contentType == null) {
            throw badRequest("Unsupported attachment type. Allowed: PDF, JPG, PNG, DOCX, XLSX, PPTX and TXT.");
        }

        String storedName = UUID.randomUUID() + extension;
        Path destination = storageRoot.resolve(storedName).normalize();
        if (!destination.startsWith(storageRoot)) {
            throw badRequest("Invalid attachment path.");
        }

        try {
            Files.createDirectories(storageRoot);
            try (var input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.COPY_ATTRIBUTES);
            }
            validateContent(destination, extension);
            return new StoredFile(storedName, originalName, contentType, file.getSize());
        } catch (ResponseStatusException ex) {
            deleteQuietly(destination);
            throw ex;
        } catch (IOException ex) {
            deleteQuietly(destination);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store the announcement attachment.", ex);
        }
    }

    public Path resolve(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found.");
        }
        Path resolved = storageRoot.resolve(storedPath).normalize();
        if (!resolved.startsWith(storageRoot) || !Files.isRegularFile(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found.");
        }
        return resolved;
    }

    public void deleteAfterCommit(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deleteQuietly(resolveForCleanup(storedPath));
                }
            });
        } else {
            deleteQuietly(resolveForCleanup(storedPath));
        }
    }

    public void deleteOnRollback(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) {
                        deleteQuietly(resolveForCleanup(storedPath));
                    }
                }
            });
        } else {
            deleteQuietly(resolveForCleanup(storedPath));
        }
    }

    private void validateContent(Path path, String extension) throws IOException {
        byte[] header;
        try (var input = Files.newInputStream(path)) {
            header = input.readNBytes(8);
        }

        boolean valid = switch (extension) {
            case ".pdf" -> startsWith(header, new byte[]{'%', 'P', 'D', 'F', '-'});
            case ".png" -> startsWith(header, new byte[]{
                    (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
            });
            case ".jpg", ".jpeg" -> startsWith(header, new byte[]{
                    (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
            });
            case ".docx" -> isOpenXmlDocument(path, "word/document.xml");
            case ".xlsx" -> isOpenXmlDocument(path, "xl/workbook.xml");
            case ".pptx" -> isOpenXmlDocument(path, "ppt/presentation.xml");
            case ".txt" -> isPlainText(header);
            default -> false;
        };

        if (!valid) {
            throw badRequest("The uploaded file content does not match its filename type.");
        }
    }

    private boolean isOpenXmlDocument(Path path, String expectedEntry) throws IOException {
        try (ZipFile zip = new ZipFile(path.toFile())) {
            return zip.getEntry("[Content_Types].xml") != null && zip.getEntry(expectedEntry) != null;
        } catch (IOException ex) {
            return false;
        }
    }

    private boolean isPlainText(byte[] header) {
        for (byte value : header) {
            if (value == 0) return false;
        }
        return true;
    }

    private boolean startsWith(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (value[i] != prefix[i]) return false;
        }
        return true;
    }

    private String safeOriginalName(String suppliedName) {
        if (suppliedName == null || suppliedName.isBlank()) {
            throw badRequest("The attachment must have a filename.");
        }
        String normalized = suppliedName.replace('\\', '/');
        String name = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (name.isBlank() || name.equals(".") || name.equals("..")
                || name.contains("..") || name.indexOf('\r') >= 0 || name.indexOf('\n') >= 0
                || name.length() > 255) {
            throw badRequest("Invalid attachment filename.");
        }
        return name;
    }

    private Path resolveForCleanup(String storedPath) {
        Path resolved = storageRoot.resolve(storedPath).normalize();
        return resolved.startsWith(storageRoot) ? resolved : storageRoot.resolve(UUID.randomUUID().toString());
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // A failed cleanup must not hide the original request or transaction result.
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public record StoredFile(String storedPath, String originalName, String contentType, long fileSize) {}
}
