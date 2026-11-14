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
    void givesAnnouncementMessageItsOwnSectionAndMovesPublicationDetailsBelowIt() {
        EmailRequest request = new EmailRequest(
                "Email Attachment Testing", null, "student@example.com",
                "ANNOUNCEMENT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", "Email Attachment Testing",
                "message", "Published by Admin for Grade 10 (2026-2027). Please review the attached documents carefully.",
                "targetUrl", "/announcements",
                "attachmentNames", java.util.List.of("school-notice.pdf", "schedule.png")
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains(">MESSAGE</p>"));
        assertTrue(rendered.html().contains("Please review the attached documents carefully."));
        assertTrue(rendered.html().contains("PUBLICATION DETAILS"));
        assertTrue(rendered.html().contains("Published by Admin for Grade 10 (2026-2027)."));
        assertTrue(rendered.html().indexOf("Please review the attached documents carefully.")
                < rendered.html().indexOf("PUBLICATION DETAILS"));
        assertTrue(rendered.html().contains("school-notice.pdf"));
        assertTrue(rendered.html().contains("schedule.png"));
        assertTrue(rendered.html().contains("border-radius:10px"));
        assertTrue(rendered.html().contains("border-radius:14px"));
        assertTrue(rendered.html().contains("border-radius:999px"));
        assertTrue(rendered.html().contains("border-radius:8px"));
        assertTrue(rendered.html().contains("border-radius:9px 0 0 9px"));
        assertTrue(rendered.html().contains(">PDF</td>"));
        assertTrue(rendered.html().contains(">PNG</td>"));
        assertTrue(rendered.plainText().contains("Attachments:\n- school-notice.pdf\n- schedule.png"));
    }

    @Test
    void keepsLongAnnouncementContentAndAttachmentNamesWithinResponsiveLayout() {
        String longTitle = "Important announcement ".repeat(12);
        String longMessage = "A".repeat(180) + "\n\nSecond paragraph with additional information.";
        String longFileName = "very-long-school-document-name-".repeat(8) + ".pdf";
        EmailRequest request = new EmailRequest(
                longTitle, null, "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", longTitle,
                "message", longMessage,
                "attachmentNames", java.util.List.of(longFileName)
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("@media only screen and (max-width:620px)"));
        assertTrue(rendered.html().contains(".email-content { padding:22px 20px 24px !important;"));
        assertTrue(rendered.html().contains("word-break:break-word"));
        assertTrue(rendered.html().contains(longFileName));
        assertTrue(rendered.plainText().contains(longFileName));
        assertTrue(rendered.html().contains("Second paragraph with additional information."));
        assertTrue(rendered.plainText().contains(longMessage));
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
        assertTrue(rendered.plainText().contains("View result: https://school.example.com/my-assessments"));
        assertTrue(rendered.html().contains("Marks: 8.00 / 10.00"));
        assertTrue(rendered.html().contains("Percentage: 80.00%"));
        assertTrue(rendered.html().contains("View result"));
    }

    @Test
    void resolvesRelativeResultLinkAgainstConfiguredFrontendBaseUrl() {
        EmailRequest request = new EmailRequest(
                "Assessment results published", "Your result is available.",
                "student@example.com", "RESULT", "A Student", null);
        request.setTemplateData(Map.of(
                "title", "Assessment results published",
                "message", "Your result is available.",
                "targetUrl", "/my-assessments",
                "resultScore", "8.00",
                "resultTotalMarks", "10.00",
                "resultPercentage", "80.00"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains(
                "View result: http://localhost:5173/my-assessments"));
        assertTrue(rendered.html().contains(
                "href=\"http://localhost:5173/my-assessments\""));
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