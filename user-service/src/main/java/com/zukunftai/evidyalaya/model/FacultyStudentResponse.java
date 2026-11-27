package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FacultyStudentResponse {
    private Long studentId;
    private String fullName;
    private String email;
    private String countryCode;
    private String phoneNumber;
    private Long academicYearId;
    private String academicYearName;
    private Long gradeId;
    private String gradeName;
    private Long sectionId;
    private String sectionName;
    private boolean enrollmentActive;
}
