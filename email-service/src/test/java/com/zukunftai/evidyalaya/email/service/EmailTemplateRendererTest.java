package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateRendererTest {

    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer();

    @Test
    void rendersBrandedAnnouncementWithEscapedContentAndSafeActionLink() {
        EmailRequest request = new EmailRequest(
                "New announcement", null, "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", "Tomorrow's <exam>",
                "message", "Please check the updated schedule.",
                "targetUrl", "https://school.example.com/announcements/12"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains("Tomorrow's <exam>"));
        assertTrue(rendered.html().contains("Tomorrow&#39;s &lt;exam&gt;"));
        assertTrue(rendered.html().contains("https://school.example.com/announcements/12"));
        assertTrue(rendered.html().contains("View announcement"));
    }

    @Test
    void doesNotRenderUnsafeActionUrl() {
        EmailRequest request = new EmailRequest(
                "Notice", "Read this", "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", "Notice",
                "message", "Read this",
                "targetUrl", "javascript:alert(1)"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertFalse(rendered.html().contains("javascript:"));
        assertFalse(rendered.plainText().contains("Open eVidyalaya: javascript:"));
    }

    @Test
    void rendersStudentSpecificAssessmentMarksPercentageAndResultLink() {
        EmailRequest request = new EmailRequest(
                "Assessment results published", "Your assessment results are now available.",
                "student@example.com", "RESULT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", "Assessment results published",
                "message", "Your assessment results are now available.",
                "targetUrl", "https://school.example.com/my-assessments",
                "assessmentTitle", "Unit Test 1",
                "subjectName", "Mathematics",
                "resultScore", new java.math.BigDecimal("8.00"),
                "resultTotalMarks", new java.math.BigDecimal("10.00"),
                "resultPercentage", new java.math.BigDecimal("80.00")
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains("Unit Test 1 (Mathematics)"));
        assertTrue(rendered.plainText().contains("Marks: 8.00 / 10.00"));
        assertTrue(rendered.plainText().contains("Percentage: 80.00%"));
        assertTrue(rendered.plainText().contains("Open eVidyalaya: https://school.example.com/my-assessments"));
        assertTrue(rendered.html().contains("Marks: 8.00 / 10.00"));
        assertTrue(rendered.html().contains("Percentage: 80.00%"));
        assertTrue(rendered.html().contains("View result"));
    }

    @Test
    void preservesVerificationOtpInPlainTextAndHtml() {
        EmailRequest request = new EmailRequest(
                "Verify your email", null, "student@example.com", "VERIFY", "A Student", "482913");

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains("482913"));
        assertTrue(rendered.html().contains("482913"));
        assertTrue(rendered.plainText().contains("10 minutes"));
    }

    @Test
    void usesProvidedPlainTextForGenericTestEmails() {
        EmailRequest request = new EmailRequest(
                "Integration test", "Authenticated email integration is working.",
                "student@example.com", "TEST", "eVidyalaya Test", null);

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains("Authenticated email integration is working."));
        assertTrue(rendered.html().contains("Authenticated email integration is working."));
    }
}