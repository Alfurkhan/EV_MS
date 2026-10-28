package com.zukunftai.evidyalaya.database;

/** Approval lifecycle for a timetable entry. Independent of the active flag. */
public enum TimetableStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED
}
