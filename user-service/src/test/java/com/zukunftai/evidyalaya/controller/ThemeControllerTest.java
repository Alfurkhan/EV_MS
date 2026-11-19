package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ThemeControllerTest {

    private final SchoolSettingsService schoolSettingsService =
            mock(SchoolSettingsService.class);

    private final ThemeController controller =
            new ThemeController(schoolSettingsService);

    @Test
    void getThemeReturnsOceanBlueDefaultsWhenNoThemeIsSaved() {
        when(schoolSettingsService.getSettings()).thenReturn(Map.of());

        ThemeController.ThemeSettings result = controller.getTheme();

        assertEquals("ocean-blue", result.palette());
        assertEquals("#2563EB", result.primaryColor());
        assertEquals("#0D9488", result.accentColor());
    }

    @Test
    void getThemeReturnsSavedGlobalTheme() {
        when(schoolSettingsService.getSettings()).thenReturn(Map.of(
                "theme.palette", "royal-violet",
                "theme.primaryColor", "#7C3AED",
                "theme.accentColor", "#0D9488"
        ));

        ThemeController.ThemeSettings result = controller.getTheme();

        assertEquals("royal-violet", result.palette());
        assertEquals("#7C3AED", result.primaryColor());
        assertEquals("#0D9488", result.accentColor());
    }
}
