package com.zukunftai.evidyalaya.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyClassAttendanceSummary {

    private Long subjectId;

    private String subjectName;

    private String subjectCode;

    private Long gradeId;

    private String gradeName;

    private Long sectionId;

    private String sectionName;

    private Double attendance;
}