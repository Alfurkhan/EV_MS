package com.zukunftai.evidyalaya.service.impl;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
@Component
@RequiredArgsConstructor
public class AnnouncementScheduleJob {
    private final AnnouncementServiceImpl service;
    @Scheduled(fixedDelay = 60000)
    public void publishScheduledAndArchiveExpired() {
        service.processScheduledAnnouncements();
    }
}
