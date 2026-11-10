package com.zukunftai.evidyalaya.email.service;

import com.zukunftai.evidyalaya.email.model.EmailRequest;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Map;

@Component
public class EmailTemplateRenderer {

    public RenderedEmail render(EmailRequest request) {
        String type = request.getEmailType() == null ? "" : request.getEmailType().trim().toUpperCase();
        String name = hasText(request.getUserName()) ? request.getUserName().trim() : "User";
        Map<String, Object> data = request.getTemplateData();

        String heading;
        String content;
        String actionUrl = null;
        String actionLabel = "Open eVidyalaya";

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
                if (hasText(resultSummary)) {
                    content = content + "\n\n" + resultSummary;
                }
                actionUrl = value(data, "targetUrl", null);
                actionLabel = actionLabel(type);
            }
            case "ANNOUNCEMENT", "ASSIGNMENT", "ASSESSMENT", "TIMETABLE" -> {
                heading = value(data, "title", request.getSubject());
                content = value(data, "message", request.getBodyText());
                actionUrl = value(data, "targetUrl", null);
                actionLabel = actionLabel(type);
            }
            default -> {
                heading = hasText(request.getSubject()) ? request.getSubject() : "A message from eVidyalaya";
                content = hasText(request.getBodyText()) ? request.getBodyText() : value(data, "message", "");
                actionUrl = value(data, "targetUrl", null);
            }
        }

        String plainText = "Hello " + name + ",\n\n" + heading + "\n\n" + safe(content)
                + (isSafeHttpUrl(actionUrl) ? "\n\nOpen eVidyalaya: " + actionUrl : "")
                + "\n\nRegards,\neVidyalaya Team";

        String html = buildHtml(name, heading, content, actionUrl, actionLabel, type);
        return new RenderedEmail(plainText, html);
    }

    private String buildHtml(String name, String heading, String content, String actionUrl,
                             String actionLabel, String type) {
        StringBuilder html = new StringBuilder(1800);
        html.append("""
                <!doctype html><html lang="en"><head><meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>eVidyalaya</title></head>
                <body style="margin:0;padding:24px 12px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#243047;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
                <tr><td style="padding:26px 32px;background:#173b70;color:#ffffff;">
                <div style="font-size:22px;font-weight:700;letter-spacing:.2px;">eVidyalaya</div>
                <div style="margin-top:5px;font-size:12px;color:#dce8f8;">Smarter school management</div>
                </td></tr><tr><td style="padding:30px 32px;">
                """);
        if (hasText(type)) {
            html.append("<div style=\"display:inline-block;margin-bottom:16px;padding:6px 10px;border-radius:20px;background:#edf3fb;color:#315784;font-size:11px;font-weight:700;letter-spacing:.5px;\">")
                    .append(escape(type.replace('_', ' '))).append("</div>");
        }
        html.append("<p style=\"margin:0 0 14px;font-size:15px;\">Hello ")
                .append(escape(name)).append(",</p>");
        html.append("<h1 style=\"margin:0 0 18px;font-size:23px;line-height:1.3;color:#173b70;\">")
                .append(escape(heading)).append("</h1>");
        html.append("<div style=\"font-size:15px;line-height:1.7;color:#46546a;\">")
                .append(paragraphs(content)).append("</div>");
        if (isSafeHttpUrl(actionUrl)) {
            html.append("<p style=\"margin:26px 0 8px;\"><a href=\"")
                    .append(escape(actionUrl))
                    .append("\" style=\"display:inline-block;padding:12px 20px;border-radius:7px;background:#245da8;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;\">")
                    .append(escape(actionLabel)).append("</a></p>");
        }
        html.append("""
                <p style="margin:30px 0 0;padding-top:18px;border-top:1px solid #e8edf4;font-size:13px;line-height:1.6;color:#718096;">
                Regards,<br><strong style="color:#40516a;">eVidyalaya Team</strong></p>
                </td></tr><tr><td style="padding:16px 32px;background:#f8fafc;font-size:11px;line-height:1.5;color:#8792a3;">
                This is an automated message from eVidyalaya. Please do not reply to this email.
                </td></tr></table></body></html>
                """);
        return html.toString();
    }

    private String paragraphs(String value) {
        String normalized = safe(value).replace("\r\n", "\n").replace('\r', '\n');
        String[] blocks = normalized.split("\n\\s*\n");
        StringBuilder result = new StringBuilder();
        for (String block : blocks) {
            if (block.isBlank()) continue;
            result.append("<p style=\"margin:0 0 14px;\">")
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
        if (!hasText(score) && !hasText(total) && !hasText(percentage) && !hasText(grade)) {
            return "";
        }

        String assessment = value(data, "assessmentTitle", null);
        String subject = value(data, "subjectName", null);
        StringBuilder summary = new StringBuilder("Your result");
        if (hasText(assessment)) summary.append(" for ").append(assessment);
        if (hasText(subject)) summary.append(" (").append(subject).append(")");
        summary.append(":");
        if (hasText(score) || hasText(total)) {
            summary.append("\nMarks: ").append(hasText(score) ? score : "—")
                    .append(" / ").append(hasText(total) ? total : "—");
        }
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

    private boolean isSafeHttpUrl(String value) {
        if (!hasText(value)) return false;
        try {
            String scheme = URI.create(value.trim()).getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String escape(String value) {
        return safe(value).replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public record RenderedEmail(String plainText, String html) {}
}
