import api from "../../../api/axios";
import type { Assessment, AssessmentRequest } from "../types/assessment";
export async function getFacultyAssessments(): Promise<Assessment[]> { return (await api.get<Assessment[]>("/assessments/faculty")).data; }
export async function getFacultyAssessment(id: number): Promise<Assessment> { return (await api.get<Assessment>(`/assessments/faculty/${id}`)).data; }
export async function createAssessmentDraft(data: AssessmentRequest): Promise<Assessment> { return (await api.post<Assessment>("/assessments/faculty/drafts", data)).data; }
export async function updateAssessmentDraft(id: number, data: AssessmentRequest): Promise<Assessment> { return (await api.put<Assessment>(`/assessments/faculty/${id}`, data)).data; }
export async function publishAssessment(id: number): Promise<Assessment> { return (await api.post<Assessment>(`/assessments/faculty/${id}/publish`)).data; }