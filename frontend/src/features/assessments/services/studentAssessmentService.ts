import api from "../../../api/axios";
import type { StudentAssessment, StudentAttempt } from "../types/studentAssessment";
export async function getStudentAssessments():Promise<StudentAssessment[]>{return (await api.get<StudentAssessment[]>("/assessments/student")).data;}
export async function startStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.post<StudentAttempt>(`/assessments/student/${id}/attempts`)).data;}
export async function getStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.get<StudentAttempt>(`/assessments/student/attempts/${id}`)).data;}
export async function saveStudentAnswer(attemptId:number,questionId:number,answer:unknown):Promise<StudentAttempt>{return (await api.put<StudentAttempt>(`/assessments/student/attempts/${attemptId}/answers/${questionId}`,answer)).data;}
export async function submitStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.post<StudentAttempt>(`/assessments/student/attempts/${id}/submit`)).data;}
