package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.SchoolSetting;
import com.zukunftai.evidyalaya.database.SchoolSettingAudit;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.SchoolSettingAuditRepository;
import com.zukunftai.evidyalaya.repository.SchoolSettingRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import com.zukunftai.evidyalaya.service.SchoolSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class SchoolSettingsServiceImpl implements SchoolSettingsService {

    private static final Set<String> ALLOWED_KEYS = Set.of(
            "school.name", "school.tagline", "school.address", "school.phone",
            "school.email", "school.website", "school.logoUrl",
            "academic.defaultAcademicYearId", "academic.gradingScale",
            "attendance.minimumPercentage", "attendance.workingDays",
            "attendance.allowFacultyCorrection",
            "timetable.defaultPeriodMinutes", "timetable.workingDays",
            "notifications.email.enabled", "notifications.inApp.enabled",
            "notifications.announcement.email", "notifications.assignment.email",
            "notifications.assessment.email", "notifications.timetable.email",
            "notifications.result.email",
            "assignments.maxUploadSizeMb", "assignments.allowedFileTypes",
            "examinations.allowResultRepublish",
            "users.requireAdminApproval", "security.sessionTimeoutMinutes"
    );

    private static final Set<String> BOOLEAN_KEYS = Set.of(
            "attendance.allowFacultyCorrection",
            "notifications.email.enabled", "notifications.inApp.enabled",
            "notifications.announcement.email", "notifications.assignment.email",
            "notifications.assessment.email", "notifications.timetable.email",
            "notifications.result.email", "examinations.allowResultRepublish",
            "users.requireAdminApproval"
    );

    private final SchoolSettingRepository settingsRepository;
    private final SchoolSettingAuditRepository auditRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getSettings() {
        Map<String, String> values = new LinkedHashMap<>();
        settingsRepository.findAll().forEach(setting ->
                values.put(setting.getSettingKey(), setting.getSettingValue()));
        return values;
    }

    @Override
    public Map<String, String> updateSettings(Map<String, String> settings, Long actorId) {
        if (settings == null || settings.isEmpty()) {
            throw new APIException("At least one setting is required.",
                    HttpStatus.BAD_REQUEST, "SETTINGS_EMPTY");
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new APIException("Admin account was not found.",
                        HttpStatus.UNAUTHORIZED, "SETTINGS_ACTOR_NOT_FOUND"));

        if (settings.size() > ALLOWED_KEYS.size()) {
            throw new APIException("Too many settings were submitted.",
                    HttpStatus.BAD_REQUEST, "SETTINGS_LIMIT_EXCEEDED");
        }

        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (!ALLOWED_KEYS.contains(key)) {
                throw new APIException("Unsupported setting: " + key,
                        HttpStatus.BAD_REQUEST, "UNSUPPORTED_SETTING");
            }
            if (value == null || value.length() > 4000) {
                throw new APIException("Setting value is missing or too long: " + key,
                        HttpStatus.BAD_REQUEST, "INVALID_SETTING_VALUE");
            }
            if (BOOLEAN_KEYS.contains(key) && !value.equalsIgnoreCase("true")
                    && !value.equalsIgnoreCase("false")) {
                throw new APIException("Setting must be true or false: " + key,
                        HttpStatus.BAD_REQUEST, "INVALID_BOOLEAN_SETTING");
            }
            validateSettingValue(key, value);
        }

        settings.forEach((key, value) -> {
            SchoolSetting setting = settingsRepository.findById(key)
                    .orElseGet(() -> SchoolSetting.builder()
                            .settingKey(key)
                            .build());
            String oldValue = setting.getSettingValue();

            if (java.util.Objects.equals(oldValue, value)) {
                return;
            }

            setting.setSettingValue(value);
            setting.setUpdatedBy(actor);
            SchoolSetting saved = settingsRepository.save(setting);

            auditRepository.save(SchoolSettingAudit.builder()
                    .settingKey(key)
                    .oldValue(oldValue)
                    .newValue(value)
                    .changedBy(actor)
                    .build());
        });

        return getSettings();
    }

    private void validateSettingValue(String key, String value) {
        if (key.equals("school.email") && !value.isBlank()
                && !value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new APIException("Enter a valid school email address.",
                    HttpStatus.BAD_REQUEST, "INVALID_SCHOOL_EMAIL");
        }

        if ((key.equals("school.website") || key.equals("school.logoUrl"))
                && !value.isBlank() && !value.matches("^https?://.+$")) {
            throw new APIException("Enter a valid URL beginning with http:// or https://.",
                    HttpStatus.BAD_REQUEST, "INVALID_SETTING_URL");
        }

        if (Set.of("attendance.minimumPercentage", "timetable.defaultPeriodMinutes",
                "assignments.maxUploadSizeMb", "security.sessionTimeoutMinutes",
                "academic.defaultAcademicYearId").contains(key)) {
            try {
                long number = Long.parseLong(value);
                boolean valid = switch (key) {
                    case "attendance.minimumPercentage" -> number >= 0 && number <= 100;
                    case "timetable.defaultPeriodMinutes" -> number >= 1 && number <= 240;
                    case "assignments.maxUploadSizeMb" -> number >= 1 && number <= 100;
                    case "security.sessionTimeoutMinutes" -> number >= 5 && number <= 1440;
                    case "academic.defaultAcademicYearId" -> number > 0;
                    default -> false;
                };
                if (!valid) throw new NumberFormatException();
            } catch (NumberFormatException exception) {
                throw new APIException("Invalid numeric value for setting: " + key,
                        HttpStatus.BAD_REQUEST, "INVALID_NUMERIC_SETTING");
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettingAuditEntry> getAuditHistory() {
        return auditRepository.findTop100ByOrderByChangedAtDesc().stream()
                .map(entry -> new SettingAuditEntry(
                        entry.getId(),
                        entry.getSettingKey(),
                        entry.getOldValue(),
                        entry.getNewValue(),
                        entry.getChangedBy().getId(),
                        entry.getChangedAt()
                ))
                .toList();
    }
}
