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

/*
 * Student subject response.
 *
 * Unlike the generic Subject type, a student receives
 * the faculty actually teaching that subject for their
 * current Grade + Section + Academic Year.
 *
 * faculty can be null when the subject has not yet been
 * assigned to a faculty through the timetable.
 */
export interface StudentSubject {
    id: number;
    name: string;
    code: string;
    description: string | null;
    active: boolean;
    faculty: FacultySummary | null;
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

/*
 * Faculty:
 * Returns subjects assigned to the authenticated Faculty.
 */
export async function getMySubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subject/my");

    return response.data;
}

/*
 * Student:
 * Returns subjects belonging to the authenticated
 * student's active Grade + Section + Academic Year,
 * together with the faculty teaching each subject.
 */
export async function getMyStudentSubjects(): Promise<StudentSubject[]> {
    const response = await api.get<StudentSubject[]>(
        "/subject/my/student"
    );

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