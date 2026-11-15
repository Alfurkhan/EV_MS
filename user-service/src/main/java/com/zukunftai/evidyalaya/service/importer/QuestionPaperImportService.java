package com.zukunftai.evidyalaya.service.importer;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts text from searchable PDF and DOCX question papers and converts
 * clearly numbered questions/options into a reviewable draft structure.
 * It deliberately does not guess answer keys.
 */
@Service
public class QuestionPaperImportService {
    private static final long MAX_BYTES = 25L * 1024 * 1024;
    private static final Pattern QUESTION = Pattern.compile("^\\s*(?:Q(?:uestion)?\\s*)?(\\d{1,3})\\s*[.) :-]\\s*(.*)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern OPTION = Pattern.compile("^\\s*(?:\\(([A-Da-d])\\)|([A-Da-d])[.)])\\s*(.+)$");

    public ImportResult preview(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a question paper to import.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Question papers must be 25 MB or smaller.");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String lower = name.toLowerCase(Locale.ROOT);
        try {
            byte[] bytes = file.getBytes();
            String text;
            if (lower.endsWith(".pdf") && startsWith(bytes, "%PDF-")) {
                text = readPdf(bytes);
            } else if (lower.endsWith(".docx") && isZip(bytes)) {
                text = readDocx(bytes);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Supported question-paper formats are searchable PDF and DOCX. Scanned PDFs and images need OCR and are not supported by this importer yet.");
            }
            if (text == null || text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "No selectable text was found. This may be a scanned paper; OCR support is required for this file.");
            }
            return parse(name, text);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "The question paper could not be read. Check that the file is valid and not password-protected.");
        }
    }

    private String readPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String readDocx(byte[] bytes) throws IOException {
        StringBuilder text = new StringBuilder();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            document.getParagraphs().forEach(p -> text.append(p.getText()).append('\n'));
            for (XWPFTable table : document.getTables()) {
                table.getRows().forEach(row -> row.getTableCells().forEach(cell ->
                        text.append(cell.getText()).append('\n')));
            }
        }
        return text.toString();
    }

    private ImportResult parse(String filename, String source) {
        List<MutableQuestion> parsed = new ArrayList<>();
        MutableQuestion current = null;
        for (String raw : source.replace('\r', '\n').split("\\n")) {
            String line = raw.replaceAll("\\s+", " ").trim();
            if (line.isEmpty()) continue;
            Matcher questionMatch = QUESTION.matcher(line);
            Matcher optionMatch = OPTION.matcher(line);
            if (questionMatch.matches()) {
                current = new MutableQuestion();
                String body = questionMatch.group(2).trim();
                current.text.append(body);
                parsed.add(current);
            } else if (current != null && optionMatch.matches()) {
                String optionText = optionMatch.group(3).trim();
                if (!optionText.isEmpty()) current.options.add(optionText);
            } else if (current != null) {
                if (current.options.isEmpty()) {
                    if (!current.text.isEmpty()) current.text.append(' ');
                    current.text.append(line);
                } else if (!current.options.isEmpty()) {
                    int last = current.options.size() - 1;
                    current.options.set(last, current.options.get(last) + " " + line);
                }
            }
        }

        List<ImportedQuestion> questions = new ArrayList<>();
        for (MutableQuestion item : parsed) {
            String questionText = item.text.toString().trim();
            if (questionText.isEmpty()) continue;
            boolean mcq = item.options.size() >= 2;
            questions.add(new ImportedQuestion(questionText,
                    mcq ? "MCQ" : "DESCRIPTIVE",
                    mcq ? List.copyOf(item.options) : List.of(),
                    BigDecimal.ONE,
                    questions.size()));
        }
        List<String> warnings = new ArrayList<>();
        if (questions.isEmpty()) {
            warnings.add("No numbered questions were detected. Use question numbers such as '1.' or 'Question 1.' on separate lines.");
        }
        if (questions.stream().anyMatch(q -> q.questionType().equals("MCQ"))) {
            warnings.add("Correct answers are intentionally left blank. Confirm every option and choose the answer key before publishing.");
        }
        warnings.add("Imported text is a draft preview. Review question wording, option order, question types and marks before saving.");
        return new ImportResult(filename, questions.size(), questions, warnings);
    }

    private boolean startsWith(byte[] bytes, String prefix) {
        return bytes.length >= prefix.length()
                && new String(bytes, 0, prefix.length(), StandardCharsets.US_ASCII).equals(prefix);
    }

    private boolean isZip(byte[] bytes) {
        return bytes.length >= 4 && bytes[0] == 'P' && bytes[1] == 'K';
    }

    private static final class MutableQuestion {
        private final StringBuilder text = new StringBuilder();
        private final List<String> options = new ArrayList<>();
    }

    public record ImportedQuestion(String questionText, String questionType,
                                   List<String> options, BigDecimal marks, int position) {}
    public record ImportResult(String sourceFilename, int detectedQuestionCount,
                               List<ImportedQuestion> questions, List<String> warnings) {}
}
