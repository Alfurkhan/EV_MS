import api from "../../../api/axios";

export type Grade = {
    id: number;
    academicYearId: number;
    academicYearName: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export interface GradeRequest {
    academicYearId: number;
    name: string;
    description?: string;
}


export async function getGradesByAcademicYear(
    academicYearId: number
): Promise<Grade[]> {

    const response =
        await api.get<Grade[]>(
            `/grade/academic-year/${academicYearId}`
        );

    return response.data;
}


export async function createGrade(
    data: GradeRequest
): Promise<Grade> {

    const response =
        await api.post<Grade>(
            "/grade",
            data
        );

    return response.data;
}


export const updateGrade = async (
    id: number,
    data: GradeRequest
): Promise<Grade> => {

    const response =
        await api.put<Grade>(
            `/grade/id/${id}`,
            data
        );

    return response.data;
};


export const activateGrade = async (
    id: number
): Promise<Grade> => {

    const response =
        await api.put<Grade>(
            `/grade/id/${id}/activate`
        );

    return response.data;
};


export const deactivateGrade = async (
    id: number
): Promise<Grade> => {

    const response =
        await api.put<Grade>(
            `/grade/id/${id}/deactivate`
        );

    return response.data;
};


export const deleteGrade = async (
    id: number
): Promise<void> => {

    await api.delete(`/grade/id/${id}`);
};