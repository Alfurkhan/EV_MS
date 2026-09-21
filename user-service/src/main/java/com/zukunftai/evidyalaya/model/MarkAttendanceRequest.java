package com.zukunftai.evidyalaya.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class MarkAttendanceRequest {

    @NotNull(message = "Class session ID is required")
    private Long classSessionId;

    @NotEmpty(message = "Attendance records are required")
    @Valid
    private List<AttendanceRequest> attendance;
}