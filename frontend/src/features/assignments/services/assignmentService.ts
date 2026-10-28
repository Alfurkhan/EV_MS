import api from "../../../api/axios";
import type {
    Assignment,
    AssignmentGradeRequest,
    AssignmentRequest,
    AssignmentSubmission,
    AssignmentSubmissionRequest,
} from "../types/assignment";

export async function getFacultyAssignments(): Promise<Assignment[]> {
    return (await api.get<Assignment[]>("/assignments/faculty")).data;
}

export async function createAssignmentDraft(data: AssignmentRequest): Promise<Assignment> {
    return (await api.post<Assignment>("/assignments/faculty/drafts", data)).data;
}

export async function updateAssignmentDraft(id: number, data: AssignmentRequest): Promise<Assignment> {
    return (await api.put<Assignment>(`/assignments/faculty/${id}`, data)).data;
}

export async function publishAssignment(id: number): Promise<Assignment> {
    return (await api.put<Assignment>(`/assignments/faculty/${id}/publish`)).data;
}

export async function deleteAssignmentDraft(id: number): Promise<void> {
    await api.delete(`/assignments/faculty/${id}`);
}

export async function uploadAssignmentAttachment(id: number, file: File): Promise<Assignment> {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<Assignment>(`/assignments/faculty/${id}/attachment`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    })).data;
}

export async function getAssignmentSubmissions(id: number): Promise<AssignmentSubmission[]> {
    return (await api.get<AssignmentSubmission[]>(`/assignments/faculty/${id}/submissions`)).data;
}

export async function gradeAssignmentSubmission(id: number, data: AssignmentGradeRequest): Promise<AssignmentSubmission> {
    return (await api.put<AssignmentSubmission>(`/assignments/faculty/submissions/${id}/grade`, data)).data;
}

export async function getStudentAssignments(): Promise<Assignment[]> {
    return (await api.get<Assignment[]>("/assignments/student")).data;
}

export async function getStudentAssignmentSubmissions(): Promise<AssignmentSubmission[]> {
    return (await api.get<AssignmentSubmission[]>("/assignments/student/submissions")).data;
}

export async function submitAssignment(id: number, data: AssignmentSubmissionRequest): Promise<AssignmentSubmission> {
    return (await api.post<AssignmentSubmission>(`/assignments/student/${id}/submit`, data)).data;
}

export async function uploadSubmissionAttachment(id: number, file: File): Promise<AssignmentSubmission> {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<AssignmentSubmission>(`/assignments/student/${id}/attachment`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    })).data;
}

export async function getAdminAssignments(): Promise<Assignment[]> {
    return (await api.get<Assignment[]>("/assignments/admin")).data;
}

async function downloadFile(url: string, filename: string): Promise<void> {
    const response = await api.get<Blob>(url, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}

export async function downloadAssignmentAttachment(id: number, filename: string): Promise<void> {
    await downloadFile(`/assignments/${id}/attachment`, filename);
}

export async function downloadSubmissionAttachment(id: number, filename: string): Promise<void> {
    await downloadFile(`/assignments/submissions/${id}/attachment`, filename);
}
