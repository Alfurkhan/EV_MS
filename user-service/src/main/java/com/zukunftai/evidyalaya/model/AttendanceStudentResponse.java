package com.zukunftai.evidyalaya.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttendanceStudentResponse {

    private Long studentId;

    private String studentName;

    private String studentEmail;

    private AttendanceStatus status;

    private String remarks;
}