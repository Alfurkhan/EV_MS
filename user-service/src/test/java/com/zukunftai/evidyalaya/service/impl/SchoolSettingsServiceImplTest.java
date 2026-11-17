package com.zukunftai.evidyalaya.service.impl;

import com.zukunftai.evidyalaya.database.SchoolSetting;
import com.zukunftai.evidyalaya.database.User;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.SchoolSettingAuditRepository;
import com.zukunftai.evidyalaya.repository.SchoolSettingRepository;
import com.zukunftai.evidyalaya.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchoolSettingsServiceImplTest {

    @Mock
    private SchoolSettingRepository settingsRepository;

    @Mock
    private SchoolSettingAuditRepository auditRepository;

    @Mock
    private UserRepository userRepository;

    private SchoolSettingsServiceImpl service;
    private User admin;

    @BeforeEach
    void setUp() {
        service = new SchoolSettingsServiceImpl(
                settingsRepository, auditRepository, userRepository
        );
        admin = new User();
        admin.setId(42L);
        when(userRepository.findById(42L)).thenReturn(Optional.of(admin));
    }

    @Test
    void updateSettingsPersistsValueAndCreatesAuditEntry() {
        when(settingsRepository.findById("school.name")).thenReturn(Optional.empty());
        when(settingsRepository.save(any(SchoolSetting.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(settingsRepository.findAll()).thenReturn(List.of(
                SchoolSetting.builder()
                        .settingKey("school.name")
                        .settingValue("North Star School")
                        .build()
        ));

        Map<String, String> result = service.updateSettings(
                Map.of("school.name", "North Star School"), 42L
        );

        assertEquals("North Star School", result.get("school.name"));

        ArgumentCaptor<SchoolSetting> settingCaptor =
                ArgumentCaptor.forClass(SchoolSetting.class);
        verify(settingsRepository).save(settingCaptor.capture());
        assertEquals("school.name", settingCaptor.getValue().getSettingKey());
        assertEquals("North Star School", settingCaptor.getValue().getSettingValue());
        assertSame(admin, settingCaptor.getValue().getUpdatedBy());

        ArgumentCaptor<com.zukunftai.evidyalaya.database.SchoolSettingAudit> auditCaptor =
                ArgumentCaptor.forClass(com.zukunftai.evidyalaya.database.SchoolSettingAudit.class);
        verify(auditRepository).save(auditCaptor.capture());
        assertEquals("school.name", auditCaptor.getValue().getSettingKey());
        assertEquals("North Star School", auditCaptor.getValue().getNewValue());
        assertSame(admin, auditCaptor.getValue().getChangedBy());
    }

    @Test
    void updateSettingsRejectsUnknownKeys() {
        APIException exception = assertThrows(APIException.class,
                () -> service.updateSettings(Map.of("unknown.setting", "value"), 42L));

        assertEquals("UNSUPPORTED_SETTING", exception.getResponseErrorCode());
        verify(settingsRepository, never()).save(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void updateSettingsRejectsInvalidBooleanValues() {
        APIException exception = assertThrows(APIException.class,
                () -> service.updateSettings(
                        Map.of("notifications.email.enabled", "sometimes"), 42L
                ));

        assertEquals("INVALID_BOOLEAN_SETTING", exception.getResponseErrorCode());
        verify(settingsRepository, never()).save(any());
    }

    @Test
    void updateSettingsRejectsOutOfRangeAttendanceThreshold() {
        APIException exception = assertThrows(APIException.class,
                () -> service.updateSettings(
                        Map.of("attendance.minimumPercentage", "125"), 42L
                ));

        assertEquals("INVALID_NUMERIC_SETTING", exception.getResponseErrorCode());
        verify(settingsRepository, never()).save(any());
    }
}
