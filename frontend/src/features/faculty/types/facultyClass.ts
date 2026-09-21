export type FacultyClassStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type FacultyClassType = "ONLINE" | "OFFLINE";

export interface FacultyClass {
    timetableId: number;
    sessionId: number | null;

    sessionDate: string;

    status: FacultyClassStatus;

    startedAt: string | null;
    endedAt: string | null;
    durationMinutes: number | null;

    academicYearId: number;
    academicYearName: string;

    gradeId: number;
    gradeName: string;

    sectionId: number;
    sectionName: string;

    subjectId: number;
    subjectName: string;
    subjectCode: string;

    facultyId: number;
    facultyName: string;
    facultyEmail: string;

    scheduledStartTime: string;
    scheduledEndTime: string;

    startDate: string;
    endDate: string;

    classType: FacultyClassType;

    room: string | null;
    meetingLink: string | null;
    notes: string | null;
}
