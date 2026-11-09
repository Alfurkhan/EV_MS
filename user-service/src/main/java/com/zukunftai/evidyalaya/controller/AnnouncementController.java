package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.model.*;
import com.zukunftai.evidyalaya.service.impl.AnnouncementServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementServiceImpl service;
    private final com.zukunftai.evidyalaya.service.impl.AnnouncementAttachmentStorageService attachmentStorage;
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<AnnouncementResponse> list(){ return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse create(@Valid @RequestBody AnnouncementRequest request){ return service.create(request); }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse update(@PathVariable Long id,@Valid @RequestBody AnnouncementRequest request){ return service.update(id,request); }
    @PostMapping(path = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public AnnouncementResponse uploadAttachments(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        return service.uploadAttachments(id, files);
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        service.deleteAttachment(id, attachmentId);
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @RequestParam(defaultValue = "false") boolean inline) throws IOException {
        var attachment = service.getAttachmentForDownload(id, attachmentId);
        Resource resource = new UrlResource(service.resolveAttachmentPath(attachment.getStoredPath()).toUri());
        String contentType = attachment.getContentType();
        boolean previewable = "application/pdf".equals(contentType) || contentType.startsWith("image/");
        String filename = attachment.getOriginalName().replace("\\r", "").replace("\\n", "");
        ContentDisposition disposition = (inline && previewable
                ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(filename, StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(resource);
    }

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
