package com.zukunftai.evidyalaya.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
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
