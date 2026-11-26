package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReportData {
    private String reportTitle;
    private String generatedAt;
    private String academicYear;
    private String preparedBy;
    private SchoolIdentity school;
    private List<String> columns;
    private List<List<String>> rows;
    private List<SummaryMetric> summary;
    private List<ReportSection> sections;

    @Data
    @Builder
    public static class SummaryMetric {
        private String label;
        private String value;
    }

    @Data
    @Builder
    public static class ReportSection {
        private String title;
        private List<String> columns;
        private List<List<String>> rows;
    }

    @Data
    @Builder
    public static class SchoolIdentity {
        private String name;
        private String tagline;
        private String address;
        private String phone;
        private String email;
        private String website;
        private String logoUrl;
        private String primaryColor;
        private String accentColor;
    }
}
