package com.zukunftai.evidyalaya.service.email;

import com.zukunftai.evidyalaya.database.EmailNotificationAttachmentSnapshot;
import com.zukunftai.evidyalaya.model.EmailAttachmentSource;
import com.zukunftai.evidyalaya.repository.EmailNotificationAttachmentSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailAttachmentSnapshotServiceTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void snapshotsFileBytesAndSafeMetadata() throws Exception {
        EmailNotificationAttachmentSnapshotRepository repository =
                mock(EmailNotificationAttachmentSnapshotRepository.class);
        AtomicReference<List<EmailNotificationAttachmentSnapshot>> savedSnapshots = new AtomicReference<>();
        when(repository.saveAll(any())).thenAnswer(invocation -> {
            List<EmailNotificationAttachmentSnapshot> saved = invocation.getArgument(0);
            savedSnapshots.set(saved);
            return saved;
        });
        EmailAttachmentSnapshotService service = new EmailAttachmentSnapshotService(repository);

        Path source = temporaryDirectory.resolve("worksheet.txt");
        byte[] expected = "Student worksheet".getBytes();
        Files.write(source, expected);

        List<String> ids = service.snapshot(List.of(
                new EmailAttachmentSource(source.toString(), "worksheet.txt", "text/plain")));

        assertEquals(1, ids.size());
        verify(repository).saveAll(any());
        EmailNotificationAttachmentSnapshot snapshot = savedSnapshots.get().get(0);
        assertEquals("worksheet.txt", snapshot.getFileName());
        assertEquals("text/plain", snapshot.getContentType());
        assertArrayEquals(expected, snapshot.getContent());
        assertEquals(expected.length, snapshot.getFileSize());
    }

    @Test
    void rejectsMissingSourceFile() {
        EmailNotificationAttachmentSnapshotRepository repository =
                mock(EmailNotificationAttachmentSnapshotRepository.class);
        EmailAttachmentSnapshotService service = new EmailAttachmentSnapshotService(repository);

        assertThrows(IllegalStateException.class, () -> service.snapshot(List.of(
                new EmailAttachmentSource(
                        temporaryDirectory.resolve("missing.pdf").toString(),
                        "missing.pdf", "application/pdf"))));
        verify(repository, never()).saveAll(any());
    }

    @Test
    void rejectsCombinedAttachmentsOverEmailLimit() throws Exception {
        EmailNotificationAttachmentSnapshotRepository repository =
                mock(EmailNotificationAttachmentSnapshotRepository.class);
        EmailAttachmentSnapshotService service = new EmailAttachmentSnapshotService(repository);
        Path first = temporaryDirectory.resolve("first.bin");
        Path second = temporaryDirectory.resolve("second.bin");
        Files.write(first, new byte[13 * 1024 * 1024]);
        Files.write(second, new byte[13 * 1024 * 1024]);

        assertThrows(IllegalArgumentException.class, () -> service.snapshot(List.of(
                new EmailAttachmentSource(first.toString(), "first.bin", "application/octet-stream"),
                new EmailAttachmentSource(second.toString(), "second.bin", "application/octet-stream"))));
        verify(repository, never()).saveAll(any());
    }
}
