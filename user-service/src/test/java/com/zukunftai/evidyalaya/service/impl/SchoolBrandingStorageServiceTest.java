package com.zukunftai.evidyalaya.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class SchoolBrandingStorageServiceTest {

    @TempDir
    Path temporaryDirectory;

    private SchoolBrandingStorageService storage() {
        return new SchoolBrandingStorageService(temporaryDirectory.toString());
    }

    @Test
    void storesValidPngWithGeneratedName() {
        byte[] png = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=");
        var file = new MockMultipartFile("file", "school-logo.png", "image/png", png);

        var stored = storage().store(file);

        assertTrue(stored.storedName().matches("^[a-fA-F0-9-]{36}\\.png$"));
        assertEquals("image/png", stored.contentType());
        assertTrue(Files.isRegularFile(storage().resolve(stored.storedName())));
    }

    @Test
    void rejectsUnsupportedExtension() {
        var file = new MockMultipartFile("file", "logo.svg", "image/svg+xml", "<svg/>".getBytes());

        assertThrows(ResponseStatusException.class, () -> storage().store(file));
    }

    @Test
    void rejectsContentThatDoesNotMatchExtension() {
        var file = new MockMultipartFile("file", "logo.png", "image/png", "not an image".getBytes());

        assertThrows(ResponseStatusException.class, () -> storage().store(file));
        try (var files = Files.list(temporaryDirectory)) {
            assertEquals(0, files.count());
        } catch (Exception exception) {
            fail(exception);
        }
    }

    @Test
    void rejectsFilesLargerThanTwoMegabytes() {
        byte[] oversized = new byte[(int) SchoolBrandingStorageService.MAX_FILE_BYTES + 1];
        var file = new MockMultipartFile("file", "logo.jpg", "image/jpeg", oversized);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> storage().store(file));
        assertEquals(413, exception.getStatusCode().value());
    }

    @Test
    void rejectsPathTraversalWhenResolvingStoredName() {
        assertThrows(ResponseStatusException.class, () -> storage().resolve("../secret.png"));
    }
}