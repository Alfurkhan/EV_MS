package com.zukunftai.evidyalaya.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface SchoolSettingsService {

    Map<String, String> getSettings();

    Map<String, String> updateSettings(Map<String, String> settings, Long actorId);

    List<SettingAuditEntry> getAuditHistory();

    record SettingAuditEntry(
            Long id,
            String key,
            String oldValue,
            String newValue,
            Long changedBy,
            Instant changedAt
    ) {}
}
