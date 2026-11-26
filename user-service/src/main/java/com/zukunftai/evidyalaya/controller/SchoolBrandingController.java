package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.config.UserPrincipal;
import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import com.zukunftai.evidyalaya.service.impl.SchoolBrandingStorageService;
import com.zukunftai.evidyalaya.service.impl.SchoolBrandingStorageService.StoredLogo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequiredArgsConstructor
public class SchoolBrandingController {

    private static final String LOGO_SETTING_KEY = "school.logoUrl";
    private static final String LOGO_URL_PREFIX = "/public/school-branding/logo/";

    private final SchoolSettingsService settingsService;
    private final SchoolBrandingStorageService storageService;

    @GetMapping(path = "/school-profile", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public SchoolProfileDetails getSchoolProfile() {
        Map<String, String> settings = settingsService.getSettings();
        return new SchoolProfileDetails(
                settings.getOrDefault("school.name", ""),
                settings.getOrDefault("school.tagline", ""),
                settings.getOrDefault("school.about", ""),
                settings.getOrDefault("school.address", ""),
                settings.getOrDefault("school.phone", ""),
                settings.getOrDefault("school.email", ""),
                settings.getOrDefault("school.website", ""),
                settings.getOrDefault("school.logoUrl", "")
        );
    }

    @GetMapping(path = "/public/school-branding", produces = MediaType.APPLICATION_JSON_VALUE)
    public PublicSchoolBranding getPublicBranding() {
        Map<String, String> settings = settingsService.getSettings();
        return new PublicSchoolBranding(
                settings.getOrDefault("school.name", ""),
                settings.getOrDefault("school.tagline", ""),
                settings.getOrDefault("school.logoUrl", "")
        );
    }

    @GetMapping("/public/school-branding/logo/{filename}")
    public ResponseEntity<Resource> getLogo(@PathVariable String filename) {
        if (!filename.matches("^[a-fA-F0-9-]{36}\\.(png|jpe?g|webp)$")) {
            throw new ResponseStatusException(NOT_FOUND, "School logo not found.");
        }

        var path = storageService.resolve(filename);
        String contentType = filename.toLowerCase().endsWith(".png") ? "image/png"
                : filename.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(path));
    }

    @PostMapping(path = "/admin/settings/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LogoUploadResponse uploadLogo(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        StoredLogo stored = storageService.store(file);
        String previousUrl = settingsService.getSettings().get(LOGO_SETTING_KEY);

        try {
            String newUrl = LOGO_URL_PREFIX + stored.storedName();
            settingsService.updateSettings(Map.of(LOGO_SETTING_KEY, newUrl), principal.getId());
            if (previousUrl != null && previousUrl.startsWith(LOGO_URL_PREFIX)) {
                String previousName = previousUrl.substring(LOGO_URL_PREFIX.length());
                if (!previousName.equals(stored.storedName())) {
                    storageService.deleteAfterCommit(previousName);
                }
            }
            storageService.deleteOnRollback(stored.storedName());
            return new LogoUploadResponse(newUrl, stored.contentType(), stored.fileSize());
        } catch (RuntimeException exception) {
            // If the transaction rolls back, the registered synchronization removes the new file.
            storageService.deleteOnRollback(stored.storedName());
            throw exception;
        }
    }

    @DeleteMapping("/admin/settings/logo")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> removeLogo(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String previousUrl = settingsService.getSettings().get(LOGO_SETTING_KEY);
        settingsService.updateSettings(Map.of(LOGO_SETTING_KEY, ""), principal.getId());
        if (previousUrl != null && previousUrl.startsWith(LOGO_URL_PREFIX)) {
            storageService.deleteAfterCommit(previousUrl.substring(LOGO_URL_PREFIX.length()));
        }
        return ResponseEntity.noContent().build();
    }

    public record SchoolProfileDetails(
            String name,
            String tagline,
            String about,
            String address,
            String phone,
            String email,
            String website,
            String logoUrl
    ) {}

    public record PublicSchoolBranding(
            String name,
            String tagline,
            String logoUrl
    ) {}
    public record LogoUploadResponse(String logoUrl, String contentType, long fileSize) {}
}