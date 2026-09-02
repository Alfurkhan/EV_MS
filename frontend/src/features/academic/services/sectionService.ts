import api from "../../../api/axios";

export type Section = {
    id: number;
    gradeId: number;
    gradeName: string;
    academicYearId: number;
    academicYearName: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export interface SectionRequest {
    gradeId: number;
    name: string;
    description?: string;
}

export async function getSectionsByGrade(
    gradeId: number
): Promise<Section[]> {
    const response = await api.get<Section[]>(
        `/section/grade/${gradeId}`
    );

    return response.data;
}

export async function createSection(
    data: SectionRequest
): Promise<Section> {
    const response = await api.post<Section>(
        "/section",
        data
    );

    return response.data;
}

export async function updateSection(
    id: number,
    data: SectionRequest
): Promise<Section> {
    const response = await api.put<Section>(
        `/section/id/${id}`,
        data
    );

    return response.data;
}

export async function activateSection(
    id: number
): Promise<Section> {
    const response = await api.put<Section>(
        `/section/id/${id}/activate`
    );

    return response.data;
}

export async function deactivateSection(
    id: number
): Promise<Section> {
    const response = await api.put<Section>(
        `/section/id/${id}/deactivate`
    );

    return response.data;
}

export async function deleteSection(
    id: number
): Promise<void> {
    await api.delete(`/section/id/${id}`);
}