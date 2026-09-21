export type StudentTimetableDay =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

export type StudentTimetableClassType =
    | "ONLINE"
    | "OFFLINE";

export interface StudentTimetableEntry {
    id: number;

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

    dayOfWeek: StudentTimetableDay;

    startDate: string;
    endDate: string;

    startTime: string;
    endTime: string;

    classType: StudentTimetableClassType;

    room: string | null;
    meetingLink: string | null;
    notes: string | null;

    active: boolean;

    createdAt: string;
    updatedAt: string;
}