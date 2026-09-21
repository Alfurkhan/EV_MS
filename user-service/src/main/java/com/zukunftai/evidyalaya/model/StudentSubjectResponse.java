package com.zukunftai.evidyalaya.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSubjectResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private boolean active;

    private FacultySummary faculty;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacultySummary {

        private Long id;

        private String fullName;

        private String email;
    }
}