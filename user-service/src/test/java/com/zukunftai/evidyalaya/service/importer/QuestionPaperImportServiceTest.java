package com.zukunftai.evidyalaya.service.importer;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuestionPaperImportServiceTest {
    private final QuestionPaperImportService service = new QuestionPaperImportService();

    @Test
    void extractsNumberedQuestionsAndLabeledOptionsFromDocx() throws Exception {
        byte[] document;
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            doc.createParagraph().createRun().setText("1. What is 2 + 2?");
            doc.createParagraph().createRun().setText("A) 3");
            doc.createParagraph().createRun().setText("B) 4");
            doc.createParagraph().createRun().setText("C) 5");
            doc.createParagraph().createRun().setText("2) Explain photosynthesis.");
            doc.write(output);
            document = output.toByteArray();
        }
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample-paper.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                document);

        QuestionPaperImportService.ImportResult result = service.preview(file);

        assertEquals(2, result.detectedQuestionCount());
        assertEquals("What is 2 + 2?", result.questions().get(0).questionText());
        assertEquals("MCQ", result.questions().get(0).questionType());
        assertEquals(List.of("3", "4", "5"), result.questions().get(0).options());
        assertEquals("Explain photosynthesis.", result.questions().get(1).questionText());
        assertEquals("DESCRIPTIVE", result.questions().get(1).questionType());
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("Correct answers")));
    }

    @Test
    void rejectsImageOnlyOrUnsupportedQuestionPaperFormats() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "paper.png", "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'});
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.preview(file));
    }

    @Test
    void rejectsEmptyQuestionPaper() {
        MockMultipartFile file = new MockMultipartFile("file", "paper.pdf", "application/pdf", new byte[0]);
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.preview(file));
    }
}
