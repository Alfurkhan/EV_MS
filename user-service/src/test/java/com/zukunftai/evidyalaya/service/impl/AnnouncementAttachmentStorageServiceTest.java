package com.zukunftai.evidyalaya.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class AnnouncementAttachmentStorageServiceTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void storesPdfWithGeneratedPathAndOriginalDisplayName() throws Exception {
        AnnouncementAttachmentStorageService storage =
                new AnnouncementAttachmentStorageService(temporaryDirectory.toString());
        byte[] pdf = "%PDF-1.7\nexample".getBytes();

        var stored = storage.store(new MockMultipartFile(
                "files", "school-calendar.pdf", "application/pdf", pdf));

        assertEquals("school-calendar.pdf", stored.originalName());
        assertEquals("application/pdf", stored.contentType());
        assertEquals(pdf.length, stored.fileSize());
        assertNotEquals("school-calendar.pdf", stored.storedPath());
        assertTrue(Files.isRegularFile(storage.resolve(stored.storedPath())));
    }

    @Test
    void rejectsUnsupportedFileExtension() {
        AnnouncementAttachmentStorageService storage =
                new AnnouncementAttachmentStorageService(temporaryDirectory.toString());

        assertThrows(ResponseStatusException.class, () -> storage.store(
                new MockMultipartFile("files", "payload.exe", "application/octet-stream", new byte[]{1, 2, 3})));
    }

    @Test
    void rejectsFileWhoseContentDoesNotMatchItsExtension() {
        AnnouncementAttachmentStorageService storage =
                new AnnouncementAttachmentStorageService(temporaryDirectory.toString());

        assertThrows(ResponseStatusException.class, () -> storage.store(
                new MockMultipartFile("files", "not-a-pdf.pdf", "application/pdf", "plain text".getBytes())));
        try (var files = Files.list(temporaryDirectory)) {
            assertEquals(0, files.count());
        }
    }

    @Test
    void rejectsPathTraversalWhenResolvingStoredFiles() {
        AnnouncementAttachmentStorageService storage =
                new AnnouncementAttachmentStorageService(temporaryDirectory.toString());

        assertThrows(ResponseStatusException.class, () -> storage.resolve("../outside.pdf"));
    }
}
