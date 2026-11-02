package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.service.importer.QuestionPaperImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/assessments/faculty/question-paper")
@RequiredArgsConstructor
public class QuestionPaperImportController {
    private final QuestionPaperImportService importService;

    @PostMapping(path = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FACULTY')")
    public QuestionPaperImportService.ImportResult preview(@RequestParam("file") MultipartFile file) {
        return importService.preview(file);
    }
}
