import api from "../../../api/axios";
import type {AdminAssessmentItem,AdminAssessmentDetail} from "../types/adminAssessment";
export async function getAdminAssessments(){return (await api.get<AdminAssessmentItem[]>("/assessments/admin")).data;}
export async function getAdminAssessment(id:number){return (await api.get<AdminAssessmentDetail>(`/assessments/admin/${id}`)).data;}
