package com.zukunftai.evidyalaya.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class SchoolBrandingStorageService {

    public static final long MAX_FILE_BYTES = 2L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".webp");

    private final Path storageRoot;

    public SchoolBrandingStorageService(
            @Value("${app.school-branding-storage-dir:uploads/school-branding}") String storageDirectory) {
        this.storageRoot = Paths.get(storageDirectory).toAbsolutePath().normalize();
    }

    public StoredLogo store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw badRequest("Choose a school logo to upload.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "The school logo must be 2 MB or smaller.");
        }

        String originalName = safeOriginalName(file.getOriginalFilename());
        int dot = originalName.lastIndexOf('.');
        String extension = dot < 0 ? "" : originalName.substring(dot).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw badRequest("Unsupported logo type. Allowed formats: PNG, JPG, JPEG and WebP.");
        }

        String storedName = UUID.randomUUID() + extension;
        Path destination = storageRoot.resolve(storedName).normalize();
        if (!destination.startsWith(storageRoot)) {
            throw badRequest("Invalid logo path.");
        }

        try {
            Files.createDirectories(storageRoot);
            try (var input = file.getInputStream()) {
                Files.copy(input, destination);
            }
            validateImage(destination, extension);
            return new StoredLogo(storedName, contentType(extension), file.getSize());
        } catch (ResponseStatusException ex) {
            deleteQuietly(destination);
            throw ex;
        } catch (IOException ex) {
            deleteQuietly(destination);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The uploaded file is not a valid supported image.", ex);
        }
    }

    public Path resolve(String storedName) {
        if (storedName == null || storedName.isBlank()
                || storedName.contains("/") || storedName.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School logo not found.");
        }
        Path resolved = storageRoot.resolve(storedName).normalize();
        if (!resolved.startsWith(storageRoot) || !Files.isRegularFile(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School logo not found.");
        }
        return resolved;
    }

    public void deleteAfterCommit(String storedName) {
        if (storedName == null || storedName.isBlank()) return;
        Runnable cleanup = () -> deleteQuietly(resolveForCleanup(storedName));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    cleanup.run();
                }
            });
        } else {
            cleanup.run();
        }
    }

    public void deleteOnRollback(String storedName) {
        if (storedName == null || storedName.isBlank()) return;
        Runnable cleanup = () -> deleteQuietly(resolveForCleanup(storedName));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) cleanup.run();
                }
            });
        } else {
            cleanup.run();
        }
    }

    private void validateImage(Path path, String extension) throws IOException {
        byte[] header;
        try (var input = Files.newInputStream(path)) {
            header = input.readNBytes(12);
        }

        boolean signatureValid = switch (extension) {
            case ".png" -> startsWith(header, new byte[]{
                    (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
            });
            case ".jpg", ".jpeg" -> startsWith(header, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
            case ".webp" -> header.length >= 12
                    && startsWith(header, new byte[]{0x52, 0x49, 0x46, 0x46})
                    && header[8] == 0x57 && header[9] == 0x45
                    && header[10] == 0x42 && header[11] == 0x50;
            default -> false;
        };

        if (!signatureValid) {
            throw badRequest("The uploaded file content does not match its image format.");
        }

        if (!extension.equals(".webp")) {
            BufferedImage image = ImageIO.read(path.toFile());
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                throw badRequest("The uploaded file is not a valid image.");
            }
        }
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
            throw badRequest("The logo must have a filename.");
        }
        String normalized = suppliedName.replace('\\', '/');
        String name = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (name.isBlank() || name.equals(".") || name.equals("..")
                || name.contains("..") || name.indexOf('\r') >= 0
                || name.indexOf('\n') >= 0 || name.length() > 255) {
            throw badRequest("Invalid logo filename.");
        }
        return name;
    }

    private String contentType(String extension) {
        return switch (extension) {
            case ".png" -> "image/png";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".webp" -> "image/webp";
            default -> "application/octet-stream";
        };
    }

    private Path resolveForCleanup(String storedName) {
        Path resolved = storageRoot.resolve(storedName).normalize();
        return resolved.startsWith(storageRoot)
                ? resolved : storageRoot.resolve(UUID.randomUUID().toString());
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // Cleanup failures must not hide the original request or transaction result.
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public record StoredLogo(String storedName, String contentType, long fileSize) {}
}