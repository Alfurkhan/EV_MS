import api from "../../../api/axios";
import type { Assessment, AssessmentRequest } from "../types/assessment";
export async function getFacultyAssessments(): Promise<Assessment[]> { return (await api.get<Assessment[]>("/assessments/faculty")).data; }
export async function getFacultyAssessment(id: number): Promise<Assessment> { return (await api.get<Assessment>(`/assessments/faculty/${id}`)).data; }
export async function createAssessmentDraft(data: AssessmentRequest): Promise<Assessment> { return (await api.post<Assessment>("/assessments/faculty/drafts", data)).data; }
export async function updateAssessmentDraft(id: number, data: AssessmentRequest): Promise<Assessment> { return (await api.put<Assessment>(`/assessments/faculty/${id}`, data)).data; }
export async function publishAssessment(id: number): Promise<Assessment> { return (await api.post<Assessment>(`/assessments/faculty/${id}/publish`)).data; }
export async function uploadAssessmentAttachment(id: number, file: File): Promise<Assessment> {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<Assessment>(`/assessments/faculty/${id}/attachment`, form, {
        headers: { "Content-Type": "multipart/form-data" }
    })).data;
}

export async function downloadAssessmentAttachment(id: number): Promise<Blob> {
    return (await api.get(`/assessments/${id}/attachment`, { responseType: "blob" })).data;
}

export interface QuestionPaperImportPreview {
    sourceFilename: string;
    detectedQuestionCount: number;
    questions: Array<{
        questionText: string;
        questionType: "MCQ" | "DESCRIPTIVE";
        options: string[];
        marks: number;
        position: number;
    }>;
    warnings: string[];
}
export async function previewQuestionPaper(file: File): Promise<QuestionPaperImportPreview> {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<QuestionPaperImportPreview>("/assessments/faculty/question-paper/preview", form, {
        headers: { "Content-Type": "multipart/form-data" }
    })).data;
}
