export type ClassSessionStatus =
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export interface ClassSessionResponse {
    id: number;
    timetableId: number;

    sessionDate: string;
    status: ClassSessionStatus;

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

    room: string | null;
}