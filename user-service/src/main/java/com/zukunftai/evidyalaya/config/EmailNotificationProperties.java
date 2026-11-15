package com.zukunftai.evidyalaya.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Global and per-event switches for the transactional email notification flow.
 * User-level preferences are intentionally handled in a later phase.
 */
@Component
@ConfigurationProperties(prefix = "email.notifications")
public class EmailNotificationProperties {

    private boolean enabled = true;
    private List<String> testEmailDomains = new ArrayList<>(List.of("zsmail.com"));
    private Map<String, Boolean> events = new HashMap<>(Map.of(
            "announcement", true,
            "assignment", true,
            "assessment", true,
            "timetable", true,
            "result", true
    ));

    public boolean isGloballyEnabled() {
        return enabled;
    }

    public boolean isEventEnabled(String sourceType) {
        if (sourceType == null || sourceType.isBlank()) {
            return false;
        }
        return events.getOrDefault(sourceType.toLowerCase(Locale.ROOT), false);
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Returns true when the address belongs to a configured non-deliverable
     * test domain. Matching is case-insensitive and uses the exact domain.
     */
    public boolean isTestEmailAddress(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        int separator = email.lastIndexOf('@');
        if (separator < 0 || separator == email.length() - 1) {
            return false;
        }
        String domain = email.substring(separator + 1).trim().toLowerCase(Locale.ROOT);
        return testEmailDomains.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .anyMatch(domain::equals);
    }

    public List<String> getTestEmailDomains() {
        return testEmailDomains;
    }

    public void setTestEmailDomains(List<String> testEmailDomains) {
        this.testEmailDomains = testEmailDomains == null
                ? new ArrayList<>()
                : new ArrayList<>(testEmailDomains);
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Map<String, Boolean> getEvents() {
        return events;
    }

    public void setEvents(Map<String, Boolean> events) {
        this.events = events == null ? new HashMap<>() : new HashMap<>(events);
    }
}
