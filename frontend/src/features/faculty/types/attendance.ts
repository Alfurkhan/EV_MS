export type AttendanceStatus =
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "EXCUSED";

export interface AttendanceStudent {
    studentId: number;
    studentName: string;
    studentEmail: string;
    status: AttendanceStatus | null;
    remarks: string | null;
}

export interface AttendanceRequest {
    studentId: number;
    status: AttendanceStatus;
    remarks: string | null;
}

export interface MarkAttendanceRequest {
    classSessionId: number;
    attendance: AttendanceRequest[];
}

export interface AttendanceResponse {
    id: number;
    classSessionId: number;
    sessionDate: string;
    timetableId: number;
    studentId: number;
    studentName: string;
    studentEmail: string;

    facultyName: string | null;
    facultyEmail: string | null;

    subjectName: string;
    subjectCode: string;
    gradeName: string;
    sectionName: string;
    status: AttendanceStatus;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FacultyClassAttendancePoint {
    date: string;
    day: string;

    timetableId: number;

    subjectId: number;
    subjectName: string;
    subjectCode: string;

    gradeId: number;
    gradeName: string;

    sectionId: number;
    sectionName: string;

    attendance: number | null;
}

export interface FacultyClassAttendanceSummary {
    subjectId: number;
    subjectName: string;
    subjectCode: string;

    gradeId: number;
    gradeName: string;

    sectionId: number;
    sectionName: string;

    attendance: number | null;
}

export interface FacultyWeeklyClassAttendanceResponse {
    weekStart: string;
    weekEnd: string;

    dailyAttendance: FacultyClassAttendancePoint[];

    classSummaries: FacultyClassAttendanceSummary[];

    overallAverage: number | null;
}