package com.zukunftai.evidyalaya.model;

public record AssessmentParticipationReportResponse(
        long totalEnrolledStudents,
        long attemptedStudents,
        long notAttemptedStudents,
        long activeAttempts,
        long submittedAttempts) {
}
