package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.service.impl.AnnouncementServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementServiceImpl service;
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<AnnouncementResponse> list(){ return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse create(@Valid @RequestBody AnnouncementRequest request){ return service.create(request); }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse update(@PathVariable Long id,@Valid @RequestBody AnnouncementRequest request){ return service.update(id,request); }
    @PostMapping("/{id}/publish") @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse publish(@PathVariable Long id){ return service.publish(id); }
    @PostMapping("/{id}/archive") @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @ResponseStatus(HttpStatus.NO_CONTENT) public void archive(@PathVariable Long id){ service.archive(id); }
    @PostMapping("/{id}/read") @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT) public void markRead(@PathVariable Long id){ service.markAnnouncementRead(id); }

    @PostMapping("/read-all") @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT) public void markAllRead(){ service.markAllAnnouncementsRead(); }
    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id){ service.delete(id); }
}
