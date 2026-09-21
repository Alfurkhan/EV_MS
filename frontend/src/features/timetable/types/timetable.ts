export type ClassType = "ONLINE" | "OFFLINE";

export interface Timetable {
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

    dayOfWeek: string;

    startDate: string;
    endDate: string;

    startTime: string;
    endTime: string;

    classType: ClassType;

    room: string | null;
    meetingLink: string | null;
    notes: string | null;

    active: boolean;

    createdAt: string;
    updatedAt: string;
}