package com.zukunftai.evidyalaya.controller;

import com.zukunftai.evidyalaya.service.importer.TestAccountImportResult;
import com.zukunftai.evidyalaya.service.importer.TestAccountImportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/test-accounts")
public class TestAccountImportController {

    private final TestAccountImportService testAccountImportService;

    public TestAccountImportController(
            TestAccountImportService testAccountImportService
    ) {
        this.testAccountImportService =
                testAccountImportService;
    }

    @PostMapping(
            value = "/import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TestAccountImportResult> importTestAccounts(
            @RequestParam("file") MultipartFile file
    ) {

        TestAccountImportResult result =
                testAccountImportService.importAccounts(file);

        return ResponseEntity.ok(result);
    }
}