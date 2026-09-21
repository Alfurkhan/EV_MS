import api from "../../../api/axios.ts";
import type { ClassType, Timetable } from "../types/timetable";

export interface TimetableRequest {
    academicYearId: number;
    gradeId: number;
    sectionId: number;
    subjectId: number;
    facultyId: number;
    dayOfWeek: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    classType: ClassType;
    room?: string;
    meetingLink?: string;
    notes?: string;
    active?: boolean;
}

export async function getTimetables(): Promise<Timetable[]> {
    const response = await api.get<Timetable[]>("/timetable");
    return response.data;
}

export async function getTimetableById(
    timetableId: number
): Promise<Timetable> {
    const response = await api.get<Timetable>(
        `/timetable/id/${timetableId}`
    );

    return response.data;
}

export async function createTimetable(
    data: TimetableRequest
): Promise<Timetable> {
    const response = await api.post<Timetable>("/timetable", data);
    return response.data;
}

export async function updateTimetable(
    timetableId: number,
    data: TimetableRequest
): Promise<Timetable> {
    const response = await api.put<Timetable>(
        `/timetable/id/${timetableId}`,
        data
    );

    return response.data;
}

export async function disableTimetable(
    timetableId: number
): Promise<void> {
    await api.put(`/timetable/id/${timetableId}/disable`);
}

export async function enableTimetable(
    timetableId: number
): Promise<void> {
    await api.put(`/timetable/id/${timetableId}/enable`);
}

export async function deleteTimetable(
    timetableId: number
): Promise<void> {
    await api.delete(`/timetable/id/${timetableId}`);
}

export async function getTimetablesByAcademicYear(
    academicYearId: number
): Promise<Timetable[]> {
    const response = await api.get<Timetable[]>(
        `/timetable/academic-year/${academicYearId}`
    );

    return response.data;
}

export async function getTimetablesByGrade(
    gradeId: number
): Promise<Timetable[]> {
    const response = await api.get<Timetable[]>(
        `/timetable/grade/${gradeId}`
    );

    return response.data;
}

export async function getTimetablesBySection(
    sectionId: number
): Promise<Timetable[]> {
    const response = await api.get<Timetable[]>(
        `/timetable/section/${sectionId}`
    );

    return response.data;
}

export async function getTimetablesByFaculty(
    facultyId: number
): Promise<Timetable[]> {
    const response = await api.get<Timetable[]>(
        `/timetable/faculty/${facultyId}`
    );

    return response.data;
}