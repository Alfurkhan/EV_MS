package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class EmailTemplateRenderer {

    @Value("${email.app-base-url:http://localhost:5173}")
    private String appBaseUrl = "http://localhost:5173";

    public RenderedEmail render(EmailRequest request) {
        String type = request.getEmailType() == null ? "" : request.getEmailType().trim().toUpperCase();
        String name = hasText(request.getUserName()) ? request.getUserName().trim() : "User";
        Map<String, Object> data = request.getTemplateData();

        String heading;
        String content;
        String actionUrl = null;
        String actionLabel = actionLabel(type);
        String publicationDetails = null;

        switch (type) {
            case "SIGNUP" -> {
                heading = "Welcome to eVidyalaya";
                content = "Your account has been successfully created. You can now sign in and start using eVidyalaya.";
            }
            case "VERIFY" -> {
                heading = "Verify your email address";
                content = "Please verify your email address to continue using eVidyalaya.\n\nYour verification OTP is: "
                        + safe(request.getOtp()) + "\nThis OTP will expire in 10 minutes.";
            }
            case "FORGOT_PASSWORD" -> {
                heading = "Password reset request";
                content = "We received a request to reset your password.\n\nYour password reset OTP is: "
                        + safe(request.getOtp()) + "\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.";
            }
            case "RESULT" -> {
                heading = value(data, "title", request.getSubject());
                content = value(data, "message", request.getBodyText());
                String resultSummary = resultSummary(data);
                if (hasText(resultSummary)) content = content + "\n\n" + resultSummary;
                actionUrl = value(data, "targetUrl", null);
            }
            case "ANNOUNCEMENT" -> {
                heading = value(data, "title", request.getSubject());
                String rawMessage = value(data, "message", request.getBodyText());
                AnnouncementContent announcement = splitAnnouncementMessage(rawMessage);
                content = announcement.message();
                publicationDetails = announcement.publicationDetails();
                actionUrl = value(data, "targetUrl", null);
            }
            case "ASSIGNMENT", "ASSESSMENT", "TIMETABLE" -> {
                heading = value(data, "title", request.getSubject());
                content = value(data, "message", request.getBodyText());
                actionUrl = value(data, "targetUrl", null);
            }
            default -> {
                heading = hasText(request.getSubject()) ? request.getSubject() : "A message from eVidyalaya";
                content = hasText(request.getBodyText()) ? request.getBodyText() : value(data, "message", "");
                actionUrl = value(data, "targetUrl", null);
            }
        }

        actionUrl = resolveActionUrl(actionUrl);
        List<String> attachmentNames = attachmentNames(data);
        String plainText = buildPlainText(name, heading, content, publicationDetails,
                attachmentNames, actionUrl, actionLabel);
        String html = buildHtml(name, heading, content, publicationDetails,
                attachmentNames, actionUrl, actionLabel, type);
        return new RenderedEmail(plainText, html);
    }

    private String buildPlainText(String name, String heading, String content,
            String publicationDetails, List<String> attachmentNames,
            String actionUrl, String actionLabel) {
        StringBuilder text = new StringBuilder("Hello ").append(name).append(",\n\n")
                .append(heading).append("\n\n")
                .append(safe(content));
        if (hasText(publicationDetails)) {
            text.append("\n\nPublication details:\n").append(publicationDetails);
        }
        if (!attachmentNames.isEmpty()) {
            text.append("\n\nAttachments:");
            attachmentNames.forEach(file -> text.append("\n- ").append(file));
        }
        if (isSafeHttpUrl(actionUrl)) text.append("\n\n").append(actionLabel).append(": ").append(actionUrl);
        return text.append("\n\nRegards,\neVidyalaya Team\n\n")
                .append("This is an automated message from eVidyalaya. Please do not reply to this email.")
                .toString();
    }

    private String buildHtml(String name, String heading, String content, String publicationDetails,
            List<String> attachmentNames, String actionUrl, String actionLabel, String type) {
        StringBuilder html = new StringBuilder(2600);
        html.append("""
                <!doctype html><html lang="en"><head><meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="x-apple-disable-message-reformatting">
                <style type="text/css">
                @media only screen and (max-width:620px) {
                  .email-outer-pad { padding:12px 8px !important; }
                  .email-header { padding:22px 22px !important; }
                  .email-content { padding:22px 20px 24px !important; }
                  .email-footer { padding-left:16px !important; padding-right:16px !important; }
                  h1 { font-size:21px !important; line-height:28px !important; }
                }
                </style>
                <title>eVidyalaya notification</title></head>
                <body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#243047;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
                <div style="display:none;font-size:1px;color:#f3f6fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
                A notification from eVidyalaya. Open this email to read the full details.
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f6fb">
                <tr><td align="center" class="email-outer-pad" style="padding:24px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e7edf5;border-radius:14px;overflow:hidden;">
                <tr><td bgcolor="#173b70" class="email-header" style="padding:26px 32px;background-color:#173b70;color:#ffffff;">
                <div style="font-size:22px;line-height:28px;font-weight:700;letter-spacing:.2px;color:#ffffff;">eVidyalaya</div>
                <div style="padding-top:5px;font-size:12px;line-height:18px;color:#dce8f8;">Smarter school management</div>
                </td></tr>
                <tr><td class="email-content" style="padding:28px 32px 30px;">
                """);
        if (hasText(type)) {
            html.append("<p style=\"margin:0 0 18px;\"><span style=\"display:inline-block;padding:6px 10px;background-color:#edf3fb;color:#315784;font-size:11px;line-height:14px;font-weight:700;letter-spacing:.5px;border-radius:999px;\">")
                    .append(escape(type.replace('_', ' '))).append("</span></p>");
        }
        html.append("<p style=\"margin:0 0 16px;font-size:15px;line-height:23px;color:#243047;\">Hello ")
                .append(escape(name)).append(",</p>");
        html.append("<h1 style=\"margin:0 0 22px;font-size:24px;line-height:31px;color:#173b70;font-weight:700;word-break:break-word;overflow-wrap:anywhere;\">")
                .append(escape(heading)).append("</h1>");
        html.append("<p style=\"margin:0 0 10px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.7px;color:#64748b;\">")
                .append("ANNOUNCEMENT".equals(type) ? "MESSAGE" : "DETAILS")
                .append("</p>");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr><td bgcolor=\"#f7f9fc\" style=\"padding:18px 20px;background-color:#f7f9fc;border:1px solid #e8edf4;border-left:3px solid #2b63a8;border-radius:10px;font-size:15px;line-height:25px;color:#34445b;word-break:break-word;overflow-wrap:anywhere;\">")
                .append(paragraphs(content)).append("</td></tr></table>");

        if (hasText(publicationDetails)) {
            html.append("<p style=\"margin:24px 0 9px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.7px;color:#64748b;\">PUBLICATION DETAILS</p>")
                    .append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr><td bgcolor=\"#fbfcfe\" style=\"padding:13px 16px;background-color:#fbfcfe;border:1px solid #e8edf4;border-radius:10px;font-size:13px;line-height:21px;color:#5b687b;\">")
                    .append(paragraphs(publicationDetails)).append("</td></tr></table>");
        }
        if (!attachmentNames.isEmpty()) {
            html.append("<p style=\"margin:24px 0 9px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.7px;color:#64748b;\">ATTACHMENTS</p>");
            for (String file : attachmentNames) {
                html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr>")
                        .append("<td width=\"48\" valign=\"middle\" bgcolor=\"#edf3fb\" style=\"width:48px;padding:10px 8px;background-color:#edf3fb;border:1px solid #e3eaf4;border-right:0;border-radius:9px 0 0 9px;text-align:center;font-size:10px;line-height:14px;font-weight:700;color:#315784;\">")
                        .append(escape(fileTypeLabel(file))).append("</td>")
                        .append("<td valign=\"middle\" bgcolor=\"#fbfcfe\" style=\"padding:10px 12px;background-color:#fbfcfe;border:1px solid #e3eaf4;border-left:0;border-radius:0 9px 9px 0;font-size:13px;line-height:19px;color:#40516a;word-break:break-word;overflow-wrap:anywhere;\">")
                        .append(escape(file)).append("</td></tr></table>")
                        .append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td height=\"7\" style=\"height:7px;font-size:1px;line-height:1px;\">&nbsp;</td></tr></table>");
            }
        }
        if (isSafeHttpUrl(actionUrl)) {
            html.append("<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:26px 0 4px;\"><tr><td bgcolor=\"#245da8\" style=\"background-color:#245da8;border-radius:8px;\"><a href=\"")
                    .append(escape(actionUrl))
                    .append("\" style=\"display:inline-block;padding:13px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:18px;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;\">")
                    .append(escape(actionLabel)).append("</a></td></tr></table>");
        }
        html.append("""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                <tr><td style="padding-top:18px;border-top:1px solid #e8edf4;font-size:13px;line-height:21px;color:#718096;">
                Regards,<br><strong style="color:#40516a;">eVidyalaya Team</strong>
                </td></tr></table>
                </td></tr>
                <tr><td bgcolor="#f8fafc" class="email-footer" style="padding:16px 24px;background-color:#f8fafc;font-size:11px;line-height:18px;color:#8792a3;text-align:center;">
                This is an automated message from eVidyalaya. Please do not reply to this email.
                </td></tr></table></td></tr></table></body></html>
                """);
        return html.toString();
    }

    private AnnouncementContent splitAnnouncementMessage(String rawMessage) {
        String message = safe(rawMessage);
        String prefix = "Published by ";
        if (!message.startsWith(prefix)) return new AnnouncementContent(message, null);
        int separator = message.indexOf(". ");
        if (separator <= prefix.length() || separator + 2 >= message.length()) {
            return new AnnouncementContent(message, null);
        }
        return new AnnouncementContent(message.substring(separator + 2).trim(),
                message.substring(0, separator + 1).trim());
    }

    private List<String> attachmentNames(Map<String, Object> data) {
        if (data == null || !(data.get("attachmentNames") instanceof List<?> names)) return List.of();
        List<String> result = new ArrayList<>();
        for (Object name : names) {
            if (name != null && hasText(String.valueOf(name))) result.add(String.valueOf(name));
        }
        return List.copyOf(result);
    }

    private String fileTypeLabel(String fileName) {
        if (!hasText(fileName)) return "FILE";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "FILE";
        String extension = fileName.substring(dot + 1).trim().toUpperCase();
        return extension.length() > 5 ? "FILE" : extension;
    }

    private String paragraphs(String value) {
        String normalized = safe(value).replace("\r\n", "\n").replace('\r', '\n');
        String[] blocks = normalized.split("\n\\s*\n");
        StringBuilder result = new StringBuilder();
        for (String block : blocks) {
            if (block.isBlank()) continue;
            result.append("<p style=\"margin:0 0 12px;\">")
                    .append(escape(block).replace("\n", "<br>"))
                    .append("</p>");
        }
        return result.toString();
    }

    private String value(Map<String, Object> data, String key, String fallback) {
        if (data == null || data.get(key) == null) return safe(fallback);
        return String.valueOf(data.get(key));
    }

    private String resultSummary(Map<String, Object> data) {
        if (data == null) return "";
        String score = value(data, "resultScore", null);
        String total = value(data, "resultTotalMarks", null);
        String percentage = value(data, "resultPercentage", null);
        String grade = value(data, "resultGrade", null);
        if (!hasText(score) && !hasText(total) && !hasText(percentage) && !hasText(grade)) return "";
        String assessment = value(data, "assessmentTitle", null);
        String subject = value(data, "subjectName", null);
        StringBuilder summary = new StringBuilder("Your result");
        if (hasText(assessment)) summary.append(" for ").append(assessment);
        if (hasText(subject)) summary.append(" (").append(subject).append(")");
        summary.append(":");
        if (hasText(score) || hasText(total)) summary.append("\nMarks: ").append(hasText(score) ? score : "—")
                .append(" / ").append(hasText(total) ? total : "—");
        if (hasText(percentage)) summary.append("\nPercentage: ").append(percentage).append("%");
        if (hasText(grade)) summary.append("\nGrade: ").append(grade);
        return summary.toString();
    }

    private String actionLabel(String type) {
        return switch (type) {
            case "ANNOUNCEMENT" -> "View announcement";
            case "ASSIGNMENT" -> "View assignment";
            case "ASSESSMENT" -> "View assessment";
            case "TIMETABLE" -> "View timetable";
            case "RESULT" -> "View result";
            default -> "Open eVidyalaya";
        };
    }

    private String resolveActionUrl(String value) {
        if (!hasText(value)) return null;
        if (isSafeHttpUrl(value)) return value.trim();
        if (!value.startsWith("/") || value.startsWith("//") || !hasText(appBaseUrl)) return null;
        try {
            URI resolved = URI.create(appBaseUrl.trim()).resolve(URI.create(value.trim()));
            return isSafeHttpUrl(resolved.toString()) ? resolved.toString() : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private boolean isSafeHttpUrl(String value) {
        if (!hasText(value)) return false;
        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme();
            return uri.getHost() != null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String escape(String value) {
        return safe(value).replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String safe(String value) { return value == null ? "" : value; }
    private boolean hasText(String value) { return value != null && !value.isBlank(); }

    private record AnnouncementContent(String message, String publicationDetails) {}
    public record RenderedEmail(String plainText, String html) {}
}
