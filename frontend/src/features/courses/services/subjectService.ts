import api from "../../../api/axios";

export interface FacultySummary {
    id: number;
    fullName: string;
    email: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    description: string | null;
    active: boolean;
    assignedFaculties: FacultySummary[];
}

export interface Faculty {
    id: number;
    fullName: string;
    email: string;
}

export async function getFaculties(): Promise<Faculty[]> {
    const response = await api.get<Faculty[]>(
        "/user/faculties"
    );

    return response.data;
}

export async function getAllSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subject");
    return response.data;
}

export async function getMySubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subject/my");
    return response.data;
}

export async function createSubject(data: {
    name: string;
    code: string;
    description?: string;
}): Promise<Subject> {

    const response = await api.post<Subject>(
        "/subject",
        data
    );

    return response.data;
}

export async function updateSubject(
    id: number,
    data: {
        name: string;
        code: string;
        description?: string;
        active: boolean;
    }
): Promise<Subject> {

    const response = await api.put<Subject>(
        `/subject/${id}`,
        data
    );

    return response.data;
}

export async function deleteSubject(
    id: number
): Promise<void> {

    await api.delete(`/subject/${id}`);
}

export async function assignFaculty(
    subjectId: number,
    facultyId: number
): Promise<void> {

    await api.post(
        `/subject/${subjectId}/faculty`,
        { facultyId }
    );
}

export async function removeFaculty(
    subjectId: number,
    facultyId: number
): Promise<void> {

    await api.delete(
        `/subject/${subjectId}/faculty/${facultyId}`
    );


}