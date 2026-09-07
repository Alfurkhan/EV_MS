import api from "../../../api/axios.ts";

export interface Subject {
    id: number;
    name: string;
    code: string;
    description: string | null;
    active: boolean;
    assignedFaculties?: {
        id: number;
        fullName: string;
        email: string;
    }[];
}

/**
 * Get all subjects assigned to a specific Grade.
 */
export async function getSubjectsForGrade(
    gradeId: number
): Promise<Subject[]> {
    const response = await api.get<Subject[]>(
        `/subject/grade/${gradeId}`
    );

    return response.data;
}

/**
 * Assign a Subject to a Grade.
 */
export async function assignSubjectToGrade(
    subjectId: number,
    gradeId: number
): Promise<void> {
    await api.post(
        `/subject/${subjectId}/grade/${gradeId}`
    );
}

/**
 * Remove a Subject from a Grade.
 */
export async function removeSubjectFromGrade(
    subjectId: number,
    gradeId: number
): Promise<void> {
    await api.delete(
        `/subject/${subjectId}/grade/${gradeId}`
    );
}

export async function getAllSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subject");
    return response.data;
}