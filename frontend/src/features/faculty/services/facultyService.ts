import api from "../../../api/axios.ts";
import type { Faculty } from "../types/faculty";
import type { FacultyClass } from "../types/facultyClass";
import type { ClassSessionResponse } from "../types/classSession";

import type {
    AttendanceStudent,
    AttendanceResponse,
    MarkAttendanceRequest,
    FacultyWeeklyClassAttendanceResponse,
} from "../types/attendance";

export interface AdminFacultyRequest {
    fullName: string;
    email: string;
    password: string;
    countryCode: string;
    phoneNumber: string;
}

export interface UpdateFacultyRequest {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
}

export async function getFaculties(): Promise<Faculty[]> {
    const response = await api.get<Faculty[]>("/user/faculties");
    return response.data;
}

export async function createFacultyByAdmin(
    data: AdminFacultyRequest
): Promise<Faculty> {
    const response = await api.post<Faculty>("/user/faculties", data);
    return response.data;
}

export async function updateFacultyByAdmin(
    facultyId: number,
    data: UpdateFacultyRequest
): Promise<void> {
    await api.put(`/user/faculties/${facultyId}`, data);
}

export async function disableFaculty(
    facultyId: number
): Promise<void> {
    await api.put(`/user/faculties/${facultyId}/disable`);
}

export async function enableFaculty(
    facultyId: number
): Promise<void> {
    await api.put(`/user/faculties/${facultyId}/enable`);
}

export async function lockFaculty(
    facultyId: number
): Promise<void> {
    await api.put(`/user/faculties/${facultyId}/lock`);
}

export async function unlockFaculty(
    facultyId: number
): Promise<void> {
    await api.put(`/user/faculties/${facultyId}/unlock`);
}

export async function deleteFaculty(
    facultyId: number
): Promise<void> {
    await api.delete(`/user/faculties/${facultyId}`);
}

export async function getMyClassesToday(): Promise<FacultyClass[]> {
    const response = await api.get<FacultyClass[]>(
        "/class-session/my/today"
    );

    return response.data;
}

export async function startClass(
    timetableId: number
): Promise<FacultyClass> {
    const response = await api.post<FacultyClass>(
        `/class-session/start/${timetableId}`
    );

    return response.data;
}

export async function endClass(
    sessionId: number
): Promise<FacultyClass> {
    const response = await api.post<FacultyClass>(
        `/class-session/end/${sessionId}`
    );

    return response.data;
}

export async function getAttendanceStudents(
    classSessionId: number
): Promise<AttendanceStudent[]> {
    const response = await api.get<AttendanceStudent[]>(
        `/attendance/session/${classSessionId}/students`
    );

    return response.data;
}

export async function markAttendance(
    data: MarkAttendanceRequest
): Promise<AttendanceResponse[]> {
    const response = await api.post<AttendanceResponse[]>(
        "/attendance/mark",
        data
    );

    return response.data;
}

export async function getMySessions(): Promise<ClassSessionResponse[]> {
    const response = await api.get<ClassSessionResponse[]>(
        "/class-session/my"
    );

    return response.data;
}

export async function getAttendanceForSession(
    classSessionId: number
): Promise<AttendanceResponse[]> {
    const response = await api.get<AttendanceResponse[]>(
        `/attendance/session/${classSessionId}`
    );

    return response.data;
}

export async function getMyAttendance(): Promise<AttendanceResponse[]> {
    const response = await api.get<AttendanceResponse[]>(
        "/attendance/my"
    );

    return response.data;
}

export async function getAdminAttendance(): Promise<AttendanceResponse[]> {
    const response = await api.get<AttendanceResponse[]>(
        "/attendance/admin"
    );
    return response.data;
}

export interface AttendanceChartPoint {
    day: string;
    attendance: number | null;
}

export interface AttendanceDashboardResponse {
    overallPercentage: number | null;
    todayPercentage: number | null;
    chart: AttendanceChartPoint[];
}

export async function getAttendanceDashboard(): Promise<AttendanceDashboardResponse> {
    const response = await api.get<AttendanceDashboardResponse>(
        "/attendance/dashboard"
    );

    return response.data;
}

export async function getFacultyWeeklyClassAttendance(): Promise<FacultyWeeklyClassAttendanceResponse> {
    const response =
        await api.get<FacultyWeeklyClassAttendanceResponse>(
            "/attendance/faculty/weekly-classes"
        );

    return response.data;
}