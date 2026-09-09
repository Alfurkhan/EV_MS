import api from "../../../api/axios.ts";

export type StudentEnrollment = {
    id: number;

    studentId: number;
    studentName: string;
    studentEmail: string;

    academicYearId: number;
    academicYearName: string;

    gradeId: number;
    gradeName: string;

    sectionId: number;
    sectionName: string;

    active: boolean;

    createdAt: string;
    updatedAt: string;
};

export interface StudentEnrollmentRequest {
    studentId: number;
    academicYearId: number;
    gradeId: number;
    sectionId: number;
}


/*
 * ============================================================
 * CREATE ENROLLMENT
 * ============================================================
 */

export async function createEnrollment(
    data: StudentEnrollmentRequest
): Promise<StudentEnrollment> {

    const response =
        await api.post<StudentEnrollment>(
            "/student-enrollment",
            data
        );

    return response.data;
}


/*
 * ============================================================
 * GET ALL ENROLLMENTS
 * ============================================================
 */

export async function getAllEnrollments(): Promise<
    StudentEnrollment[]
> {

    const response =
        await api.get<StudentEnrollment[]>(
            "/student-enrollment"
        );

    return response.data;
}


/*
 * ============================================================
 * GET ENROLLMENTS BY STUDENT
 * ============================================================
 */

export async function getEnrollmentsByStudent(
    studentId: number
): Promise<StudentEnrollment[]> {

    const response =
        await api.get<StudentEnrollment[]>(
            `/student-enrollment/student/${studentId}`
        );

    return response.data;
}


/*
 * ============================================================
 * GET ENROLLMENTS BY ACADEMIC YEAR
 * ============================================================
 */

export async function getEnrollmentsByAcademicYear(
    academicYearId: number
): Promise<StudentEnrollment[]> {

    const response =
        await api.get<StudentEnrollment[]>(
            `/student-enrollment/academic-year/${academicYearId}`
        );

    return response.data;
}


/*
 * ============================================================
 * GET ENROLLMENTS BY SECTION
 * ============================================================
 */

export async function getEnrollmentsBySection(
    sectionId: number
): Promise<StudentEnrollment[]> {

    const response =
        await api.get<StudentEnrollment[]>(
            `/student-enrollment/section/${sectionId}`
        );

    return response.data;
}


/*
 * ============================================================
 * GET ENROLLMENT BY ID
 * ============================================================
 */

export async function getEnrollmentById(
    id: number
): Promise<StudentEnrollment> {

    const response =
        await api.get<StudentEnrollment>(
            `/student-enrollment/id/${id}`
        );

    return response.data;
}


/*
 * ============================================================
 * GET ACTIVE ENROLLMENT
 * ============================================================
 */

export async function getActiveEnrollment(
    studentId: number,
    academicYearId: number
): Promise<StudentEnrollment> {

    const response =
        await api.get<StudentEnrollment>(
            `/student-enrollment/student/${studentId}/academic-year/${academicYearId}/active`
        );

    return response.data;
}


/*
 * ============================================================
 * DEACTIVATE ENROLLMENT
 * ============================================================
 */

export async function deactivateEnrollment(
    id: number
): Promise<StudentEnrollment> {

    const response =
        await api.put<StudentEnrollment>(
            `/student-enrollment/id/${id}/deactivate`
        );

    return response.data;
}


/*
 * ============================================================
 * ACTIVATE ENROLLMENT
 * ============================================================
 */

export async function activateEnrollment(
    id: number
): Promise<StudentEnrollment> {

    const response =
        await api.put<StudentEnrollment>(
            `/student-enrollment/id/${id}/activate`
        );

    return response.data;
}


/*
 * ============================================================
 * DELETE ENROLLMENT
 * ============================================================
 */

export async function deleteEnrollment(
    id: number
): Promise<void> {

    await api.delete(
        `/student-enrollment/id/${id}`
    );
}

export async function updateEnrollment(
    id: number,
    data: {
        studentId: number;
        academicYearId: number;
        gradeId: number;
        sectionId: number;
    }
): Promise<StudentEnrollment> {
    const response = await api.put<StudentEnrollment>(
        `/student-enrollment/id/${id}`,
        data
    );

    return response.data;
}

export async function getMyActiveEnrollment(): Promise<StudentEnrollment> {
    const response = await api.get<StudentEnrollment>(
        "/student-enrollment/my"
    );

    return response.data;
}