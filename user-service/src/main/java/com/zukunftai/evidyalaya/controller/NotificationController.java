package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.ManualNotificationRequest;
import com.zukunftai.evidyalaya.model.NotificationResponse;
import com.zukunftai.evidyalaya.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<NotificationResponse> list() {
        return service.listForCurrentUser();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public long unreadCount() {
        return service.unreadCount();
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public NotificationResponse markRead(@PathVariable Long id) {
        return service.markRead(id);
    }

    @PostMapping("/read-all")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        service.markAllRead();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse createManual(@Valid @RequestBody ManualNotificationRequest request) {
        return service.createManualNotification(request);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationResponse updateManual(@PathVariable Long id,
            @Valid @RequestBody ManualNotificationRequest request) {
        return service.updateManualNotification(id, request);
    }
}
