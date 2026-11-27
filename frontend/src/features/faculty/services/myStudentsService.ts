import api from "../../../api/axios";

export type FacultyStudent = {
    studentId: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;
    academicYearId: number;
    academicYearName: string;
    gradeId: number;
    gradeName: string;
    sectionId: number;
    sectionName: string;
    enrollmentActive: boolean;
};

export async function getMyStudents(params?: {
    academicYearId?: number;
    gradeId?: number;
    sectionId?: number;
}): Promise<FacultyStudent[]> {
    const response = await api.get<FacultyStudent[]>("/faculty/my-students", { params });
    return response.data;
}
