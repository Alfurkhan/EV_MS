package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping(path = "/theme", produces = "application/json")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
public class ThemeController {

    private static final String DEFAULT_PALETTE = "ocean-blue";
    private static final String DEFAULT_PRIMARY_COLOR = "#2563EB";
    private static final String DEFAULT_ACCENT_COLOR = "#0D9488";

    private final SchoolSettingsService schoolSettingsService;

    @GetMapping
    public ThemeSettings getTheme() {
        Map<String, String> settings = schoolSettingsService.getSettings();

        return new ThemeSettings(
                settings.getOrDefault("theme.palette", DEFAULT_PALETTE),
                settings.getOrDefault("theme.primaryColor", DEFAULT_PRIMARY_COLOR),
                settings.getOrDefault("theme.accentColor", DEFAULT_ACCENT_COLOR)
        );
    }

    public record ThemeSettings(
            String palette,
            String primaryColor,
            String accentColor
    ) {}
}
