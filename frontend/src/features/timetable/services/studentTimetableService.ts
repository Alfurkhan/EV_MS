import api from "../../../api/axios";
import type { StudentTimetableEntry } from "../types/studentTimetable";

/*
 * ============================================================
 * GET MY STUDENT TIMETABLE
 * ============================================================
 *
 * The backend identifies the student from the JWT.
 *
 * The frontend does NOT send:
 * - student ID
 * - grade ID
 * - section ID
 *
 * The backend resolves:
 *
 * Student
 *   ↓
 * Active Enrollment
 *   ↓
 * Grade + Section
 *   ↓
 * Active Academic Year
 *   ↓
 * Timetable
 */

export async function getMyStudentTimetable(): Promise<
    StudentTimetableEntry[]
> {
    const response =
        await api.get<StudentTimetableEntry[]>(
            "/timetable/my/student"
        );

    return response.data;
}