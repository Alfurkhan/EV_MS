import api from "../../../api/axios";
import type { StudentAssessment, StudentAttempt } from "../types/studentAssessment";
export async function getStudentAssessments():Promise<StudentAssessment[]>{return (await api.get<StudentAssessment[]>("/assessments/student")).data;}
export async function startStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.post<StudentAttempt>(`/assessments/student/${id}/attempts`)).data;}
export async function getStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.get<StudentAttempt>(`/assessments/student/attempts/${id}`)).data;}
export async function saveStudentAnswer(attemptId:number,questionId:number,answer:unknown):Promise<StudentAttempt>{return (await api.put<StudentAttempt>(`/assessments/student/attempts/${attemptId}/answers/${questionId}`,answer)).data;}
export async function submitStudentAttempt(id:number):Promise<StudentAttempt>{return (await api.post<StudentAttempt>(`/assessments/student/attempts/${id}/submit`)).data;}

export async function getStudentAssessmentAttachment(id:number):Promise<Blob>{
 return (await api.get<Blob>(`/assessments/${id}/attachment`,{responseType:"blob"})).data;
}

export async function downloadStudentAssessmentAttachment(id:number,filename:string):Promise<void>{
 const blob=await getStudentAssessmentAttachment(id);
 const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename||"assessment-attachment";document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function uploadStudentAnswerSheet(attemptId:number,questionId:number,file:File):Promise<string>{
 const data=new FormData();data.append("file",file);
 return (await api.post<{attachmentName:string}>(`/assessments/student/attempts/${attemptId}/answers/${questionId}/attachment`,data,{headers:{"Content-Type":"multipart/form-data"}})).data.attachmentName;
}
export async function downloadStudentAnswerSheet(attemptId:number,questionId:number,filename:string):Promise<void>{
 const blob=(await api.get<Blob>(`/assessments/attempts/${attemptId}/answers/${questionId}/attachment`,{responseType:"blob"})).data;
 const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename||"answer-sheet";document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
