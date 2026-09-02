import api from "../../../api/axios";

export type AcademicYear = {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type AcademicYearRequest = {
    name: string;
    startDate: string;
    endDate: string;
};


export async function getAcademicYears(): Promise<AcademicYear[]> {

    const response = await api.get<AcademicYear[]>(
        "/academic-year"
    );

    return response.data;
}


export async function getActiveAcademicYear(): Promise<AcademicYear> {

    const response = await api.get<AcademicYear>(
        "/academic-year/active"
    );

    return response.data;
}


export async function createAcademicYear(
    data: AcademicYearRequest
): Promise<AcademicYear> {

    const response =
        await api.post<AcademicYear>(
            "/academic-year",
            data
        );

    return response.data;
}


export async function updateAcademicYear(
    id: number,
    data: AcademicYearRequest
): Promise<AcademicYear> {

    const response =
        await api.put<AcademicYear>(
            `/academic-year/id/${id}`,
            data
        );

    return response.data;
}


export async function activateAcademicYear(
    id: number
): Promise<AcademicYear> {

    const response =
        await api.put<AcademicYear>(
            `/academic-year/id/${id}/activate`
        );

    return response.data;
}


export async function deactivateAcademicYear(
    id: number
): Promise<AcademicYear> {

    const response =
        await api.put<AcademicYear>(
            `/academic-year/id/${id}/deactivate`
        );

    return response.data;
}


export async function deleteAcademicYear(
    id: number
): Promise<void> {

    await api.delete(
        `/academic-year/id/${id}`
    );
}