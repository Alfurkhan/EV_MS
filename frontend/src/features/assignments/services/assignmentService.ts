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

export async function submitAssignment(id: number, data: AssignmentSubmissionRequest, file?: File | null): Promise<AssignmentSubmission> {
    const form = new FormData();
    form.append("responseText", data.responseText);
    if (file) form.append("file", file);
    return (await api.post<AssignmentSubmission>(`/assignments/student/${id}/submit`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    })).data;
}

export async function getAdminAssignments(): Promise<Assignment[]> {
    return (await api.get<Assignment[]>("/assignments/admin")).data;
}

export interface AssignmentReport {
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    submissionRate: number;
}

export async function getAssignmentReport(id: number): Promise<AssignmentReport> {
    return (await api.get<AssignmentReport>(`/assignments/faculty/${id}/report`)).data;
}

async function fetchAttachmentBlob(url: string): Promise<Blob> {
    return (await api.get<Blob>(url, { responseType: "blob" })).data;
}

async function downloadFile(url: string, filename: string): Promise<void> {
    const blob = await fetchAttachmentBlob(url);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function viewFile(url: string): Promise<void> {
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
        throw new Error("Your browser blocked the preview window. Allow pop-ups and try again.");
    }
    try {
        const blob = await fetchAttachmentBlob(url);
        const objectUrl = URL.createObjectURL(blob);
        previewWindow.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
        previewWindow.close();
        throw error;
    }
}

export async function downloadAssignmentAttachment(id: number, filename: string): Promise<void> {
    await downloadFile(`/assignments/${id}/attachment`, filename);
}

export async function downloadSubmissionAttachment(id: number, filename: string): Promise<void> {
    await downloadFile(`/assignments/submissions/${id}/attachment`, filename);
}

export async function viewAssignmentAttachment(id: number): Promise<void> {
    await viewFile(`/assignments/${id}/attachment`);
}

export async function viewSubmissionAttachment(id: number): Promise<void> {
    await viewFile(`/assignments/submissions/${id}/attachment`);
}
