package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import com.zukunftai.evidyalaya.email.model.EmailBrandingType;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateRendererTest {

    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer();

    @Test
    void rendersBrandedAnnouncementWithEscapedContentAndSafeActionLink() {
        EmailRequest request = new EmailRequest(
                "New announcement", null, "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
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
        request.setBrandingType(EmailBrandingType.SCHOOL);
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
        request.setBrandingType(EmailBrandingType.SCHOOL);
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
        request.setBrandingType(EmailBrandingType.SCHOOL);
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
        request.setBrandingType(EmailBrandingType.SCHOOL);
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
        request.setBrandingType(EmailBrandingType.SCHOOL);
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

    @Test
    void rendersSchoolIdentityLogoAndContactDetailsForSchoolNotifications() {
        EmailRequest request = new EmailRequest(
                "New announcement", null, "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.ofEntries(
                Map.entry("title", "Holiday Notice"),
                Map.entry("message", "School will remain closed tomorrow."),
                Map.entry("targetUrl", "https://school.example/announcements"),
                Map.entry("schoolName", "Green Valley School"),
                Map.entry("schoolTagline", "Learning for life"),
                Map.entry("schoolLogoUrl", "/public/school-branding/logo/123e4567-e89b-12d3-a456-426614174000.png"),
                Map.entry("schoolAddress", "12 Lake Road"),
                Map.entry("schoolPhone", "+91 9876543210"),
                Map.entry("schoolEmail", "office@greenvalley.example"),
                Map.entry("schoolWebsite", "https://greenvalley.example"),
                Map.entry("attachmentNames", java.util.List.of("holiday-notice.pdf")),
                Map.entry("schoolPrimaryColor", "#7C3AED"),
                Map.entry("schoolAccentColor", "#D97706")
        ));
        ReflectionTestUtils.setField(renderer, "appBaseUrl", "https://school.example");

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("Green Valley School"));
        assertTrue(rendered.html().contains("background-color:#7C3AED"));
        assertTrue(rendered.html().contains("color:#7C3AED"));
        assertTrue(rendered.html().contains("border-radius:8px;"));
        assertTrue(rendered.html().contains("color:#ffffff;text-decoration:none;"));
        assertTrue(rendered.html().contains("bgcolor=\"#D97706\" style=\"width:3px;background-color:#D97706;border-radius:10px 0 0 10px;\""));
        assertTrue(rendered.html().contains("background-color:#FBF1E6;color:#AE5F05"));
        assertTrue(rendered.html().contains("bgcolor=\"#FBF1E6\""));
        assertTrue(rendered.html().contains("background-color:#FBF1E6;border:1px solid #F4D9B9"));
        assertTrue(rendered.html().contains("color:#7C3AED;text-decoration:none;"));
        assertFalse(rendered.html().contains("#315784"));
        assertFalse(rendered.html().contains("#edf3fb"));
        assertFalse(rendered.html().contains("#e3eaf4"));
        assertTrue(rendered.html().contains("Learning for life"));
        assertTrue(rendered.html().contains("Powered by eVidyalaya"));
        assertEquals(1, rendered.html().split("Powered by eVidyalaya", -1).length - 1);
        assertTrue(rendered.html().contains("This is an automated message. Please do not reply to this email."));
        assertFalse(rendered.html().contains("This is an automated message from eVidyalaya."));
        assertTrue(rendered.html().contains("https://school.example/api/public/school-branding/logo/123e4567-e89b-12d3-a456-426614174000.png"));
        assertTrue(rendered.html().contains("mailto:office@greenvalley.example"));
        assertTrue(rendered.html().contains("href=\"https://greenvalley.example\""));
        assertTrue(rendered.html().contains("12 Lake Road"));
        assertTrue(rendered.plainText().contains("Green Valley School"));
        assertTrue(rendered.plainText().contains("office@greenvalley.example"));
        assertTrue(rendered.plainText().contains("Powered by eVidyalaya"));
    }

    @Test
    void appliesTealPrimaryAndAmberAccentConsistentlyAcrossSchoolEmailElements() {
        EmailRequest request = new EmailRequest(
                "New announcement", null, "student@example.com", "ANNOUNCEMENT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.of(
                "title", "School update",
                "message", "Please read the update.",
                "targetUrl", "https://school.example/announcements",
                "attachmentNames", java.util.List.of("notice.pdf"),
                "schoolName", "Sri Nagarjuna High School",
                "schoolPrimaryColor", "#0D9488",
                "schoolAccentColor", "#D97706",
                "schoolEmail", "office@school.example",
                "schoolWebsite", "https://school.example"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("background-color:#0D9488;color:#ffffff"));
        assertTrue(rendered.html().contains("color:#0D9488;font-weight:700"));
        assertTrue(rendered.html().contains("background-color:#FBF1E6;color:#AE5F05"));
        assertTrue(rendered.html().contains("bgcolor=\"#D97706\" style=\"width:3px;background-color:#D97706;border-radius:10px 0 0 10px;\""));
        assertTrue(rendered.html().contains("background-color:#FBF1E6;border:1px solid #F4D9B9"));
        assertTrue(rendered.html().contains("color:#AE5F05;"));
        assertTrue(rendered.html().contains("PDF</td>"));
        assertTrue(rendered.html().contains("href=\"https://school.example\" style=\"color:#0D9488;text-decoration:none;\""));
        assertTrue(rendered.html().contains("color:#0D9488;text-decoration:none;"));
        assertFalse(rendered.html().contains("#315784"));
        assertFalse(rendered.html().contains("#245da8"));
    }

    @Test
    void formatsIsoDueDatesForSchoolNotifications() {
        EmailRequest request = new EmailRequest(
                "New assignment", null, "student@example.com", "ASSIGNMENT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.of(
                "title", "New assignment: Assignment Test",
                "message", "A new Probability & Statistics assignment was published by Faculty Name for Grade 10 - A. Due: 2026-11-30T23:59."
                        , "schoolName", "Sri Nagarjuna High School"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.plainText().contains("Due: 30 November 2026, 11:59 PM."));
        assertTrue(rendered.html().contains("Due: 30 November 2026, 11:59 PM."));
        assertFalse(rendered.html().contains("2026-11-30T23:59"));
    }

    @Test
    void escapesSchoolBrandingValuesBeforeRenderingHtml() {
        EmailRequest request = new EmailRequest(
                "Result", null, "student@example.com", "RESULT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.of(
                "title", "Term result",
                "message", "Your result is ready.",
                "schoolName", "<img src=x onerror=alert(1)>",
                "schoolTagline", "A & B <School>",
                "schoolAddress", "Main <Road>"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("&lt;img src=x onerror=alert(1)&gt;"));
        assertTrue(rendered.html().contains("A &amp; B &lt;School&gt;"));
        assertTrue(rendered.html().contains("Main &lt;Road&gt;"));
        assertFalse(rendered.html().contains("<img src=x onerror=alert(1)>"));
    }

    @Test
    void rejectsUnsafeLogoAndWebsiteUrls() {
        EmailRequest request = new EmailRequest(
                "Assignment", null, "student@example.com", "ASSIGNMENT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.of(
                "title", "Assignment",
                "message", "New assignment available.",
                "schoolName", "Green Valley School",
                "schoolLogoUrl", "javascript:alert(1)",
                "schoolWebsite", "javascript:alert(1)"
        ));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertFalse(rendered.html().contains("javascript:"));
        assertFalse(rendered.html().contains("<img"));
        assertTrue(rendered.html().contains("Green Valley School"));
    }

    @Test
    void keepsPlatformEmailsIndependentFromSchoolBranding() {
        EmailRequest request = new EmailRequest(
                "Verify your email", null, "student@example.com", "VERIFY", "A Student", "482913");
        request.setTemplateData(Map.of(
                "schoolName", "Green Valley School",
                "schoolLogoUrl", "/public/school-branding/logo/123e4567-e89b-12d3-a456-426614174000.png",
                "schoolEmail", "office@greenvalley.example"
        ));

        assertEquals(EmailBrandingType.PLATFORM, request.getBrandingType());
        assertEquals(EmailBrandingType.PLATFORM, EmailBrandingType.from("unknown"));
        assertEquals(EmailBrandingType.PLATFORM, EmailBrandingType.from(null));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("eVidyalaya"));
        assertTrue(rendered.html().contains("Smarter school management"));
        assertTrue(rendered.html().contains("background-color:#173b70"));
        assertFalse(rendered.html().contains("background-color:#2563EB"));
        assertFalse(rendered.html().contains("Green Valley School"));
        assertFalse(rendered.html().contains("office@greenvalley.example"));
        assertTrue(rendered.plainText().contains("eVidyalaya Team"));
    }

    @Test
    void fallsBackSafelyWhenSchoolBrandingIsMissing() {
        EmailRequest request = new EmailRequest(
                "Assessment results", "Your result is available.",
                "student@example.com", "RESULT", "A Student", null);
        request.setBrandingType(EmailBrandingType.SCHOOL);
        request.setTemplateData(Map.of("title", "Assessment results", "message", "Your result is available."));

        EmailTemplateRenderer.RenderedEmail rendered = renderer.render(request);

        assertTrue(rendered.html().contains("eVidyalaya"));
        assertTrue(rendered.html().contains("Smarter school management"));
        assertTrue(rendered.plainText().contains("eVidyalaya Team"));
    }

}