package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SubjectResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private boolean active;

    private List<FacultySummaryResponse> assignedFaculties;
}