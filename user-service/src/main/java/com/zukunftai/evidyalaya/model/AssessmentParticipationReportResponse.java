package com.zukunftai.evidyalaya.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AssessmentParticipationReportResponse(
        long totalEnrolledStudents,
        long attemptedStudents,
        long notAttemptedStudents,
        long activeAttempts,
        long submittedAttempts,
        List<StudentParticipation> students) {

    public record StudentParticipation(
            Long studentId,
            String studentName,
            String email,
            String status,
            Instant startedAt,
            Instant submittedAt,
            BigDecimal score) {}
}
