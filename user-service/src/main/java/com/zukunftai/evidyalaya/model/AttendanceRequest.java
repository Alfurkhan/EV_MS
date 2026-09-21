package com.zukunftai.evidyalaya.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AttendanceRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;

    @Size(max = 500, message = "Remarks must not exceed 500 characters")
    private String remarks;
}