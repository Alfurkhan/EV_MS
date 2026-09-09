import api from "../../../api/axios.ts";

/*
 * ============================================================
 * STUDENT USER
 * ============================================================
 */

export interface StudentUser {
    id: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;

    accountEnabled: boolean;
    accountLocked: boolean;
    emailVerified: boolean;
}

/*
 * ============================================================
 * ADMIN CREATE STUDENT
 * ============================================================
 */

export interface AdminStudentRequest {
    fullName: string;
    email: string;
    password: string;
    countryCode: string;
    phoneNumber: string;
}

/*
 * ============================================================
 * GET ALL STUDENTS
 * ============================================================
 */

export async function getStudents(): Promise<StudentUser[]> {

    const response =
        await api.get<StudentUser[]>(
            "/user/students"
        );

    return response.data;
}

/*
 * ============================================================
 * CREATE STUDENT BY ADMIN
 * ============================================================
 */

export async function createStudentByAdmin(
    data: AdminStudentRequest
): Promise<StudentUser> {

    const response =
        await api.post<StudentUser>(
            "/user/students",
            data
        );

    return response.data;
}

/*
 * ============================================================
 * UPDATE STUDENT BY ADMIN
 * ============================================================
 */

export interface UpdateStudentRequest {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
}

export async function updateStudentByAdmin(
    studentId: number,
    data: UpdateStudentRequest
): Promise<StudentUser> {

    const response =
        await api.put<StudentUser>(
            `/user/students/${studentId}`,
            data
        );

    return response.data;
}

/*
 * ============================================================
 * DISABLE STUDENT
 * ============================================================
 */

export async function disableStudent(
    studentId: number
): Promise<void> {
    await api.put(
        `/user/students/${studentId}/disable`
    );
}


/*
 * ============================================================
 * ENABLE STUDENT
 * ============================================================
 */

export async function enableStudent(
    studentId: number
): Promise<void> {
    await api.put(
        `/user/students/${studentId}/enable`
    );
}

export async function lockStudent(studentId: number): Promise<void> {
    await api.put(`/user/students/${studentId}/lock`);
}

export async function unlockStudent(studentId: number): Promise<void> {
    await api.put(`/user/students/${studentId}/unlock`);
}

export async function deleteStudent(studentId: number): Promise<void> {
    await api.delete(`/user/students/${studentId}`);
}