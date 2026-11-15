import api from "../../../api/axios";
import type {AdminAssessmentItem,AdminAssessmentDetail} from "../types/adminAssessment";
import type {AssessmentRequest} from "../types/assessment";
import type {AssessmentParticipationReport} from "./assessmentService";
import type {QuestionPaperImportPreview} from "./assessmentService";
import type {FacultyEvaluationAttempt} from "../types/facultyEvaluation";
export async function getAdminAssessments(){return (await api.get<AdminAssessmentItem[]>("/assessments/admin")).data;}
export async function getAdminAssessment(id:number){return (await api.get<AdminAssessmentDetail>(`/assessments/admin/${id}`)).data;}

export async function createAdminAssessmentForFaculty(facultyId:number,data:AssessmentRequest):Promise<number>{
 return (await api.post<number>(`/assessments/admin/faculty/${facultyId}/drafts`,data)).data;
}
export async function publishAdminAssessment(id:number):Promise<void>{
 await api.post(`/assessments/admin/${id}/publish`);
}
export async function getAdminAssessmentEvaluations(id:number):Promise<FacultyEvaluationAttempt[]>{
 return (await api.get<FacultyEvaluationAttempt[]>(`/assessments/admin/${id}/evaluations`)).data;
}
export async function getAdminAssessmentEvaluation(id:number,attemptId:number):Promise<FacultyEvaluationAttempt>{
 return (await api.get<FacultyEvaluationAttempt>(`/assessments/admin/${id}/evaluations/${attemptId}`)).data;
}
export async function gradeAdminAssessmentAnswer(id:number,attemptId:number,questionId:number,marksAwarded:number,feedback:string):Promise<FacultyEvaluationAttempt>{
 return (await api.put<FacultyEvaluationAttempt>(`/assessments/admin/${id}/evaluations/${attemptId}/answers/${questionId}`,{marksAwarded,feedback})).data;
}
export async function publishAdminAssessmentResults(id:number):Promise<void>{
 await api.post(`/assessments/admin/${id}/publish-results`);
}

export async function previewAdminQuestionPaper(file:File):Promise<QuestionPaperImportPreview>{
 const form=new FormData();form.append("file",file);
 return (await api.post<QuestionPaperImportPreview>("/assessments/admin/question-paper/preview",form,{headers:{"Content-Type":"multipart/form-data"}})).data;
}
export async function uploadAdminAssessmentAttachment(id:number,file:File):Promise<void>{
 const form=new FormData();form.append("file",file);
 await api.post(`/assessments/admin/${id}/attachment`,form,{headers:{"Content-Type":"multipart/form-data"}});
}

export async function getAdminAssessmentParticipationReport(id:number):Promise<AssessmentParticipationReport>{
 return (await api.get<AssessmentParticipationReport>(`/assessments/admin/${id}/report`)).data;
}
