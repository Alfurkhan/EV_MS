package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.config.UserPrincipal;
import com.zukunftai.evidyalaya.model.SchoolSettingsUpdateRequest;
import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(path = "/admin/settings", produces = "application/json")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SchoolSettingsController {

    private final SchoolSettingsService schoolSettingsService;

    @GetMapping
    public Map<String, String> getSettings() {
        return schoolSettingsService.getSettings();
    }

    @PutMapping(consumes = "application/json")
    public Map<String, String> updateSettings(
            @Valid @RequestBody SchoolSettingsUpdateRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return schoolSettingsService.updateSettings(request.getSettings(), principal.getId());
    }

    @GetMapping("/audit")
    public Object getAuditHistory() {
        return schoolSettingsService.getAuditHistory();
    }
}
