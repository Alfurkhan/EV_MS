import api from "../../../api/axios";
import type { FacultyEvaluationAttempt } from "../types/facultyEvaluation";
export async function getAssessmentEvaluations(assessmentId: number): Promise<FacultyEvaluationAttempt[]> {
  return (await api.get<FacultyEvaluationAttempt[]>(`/assessments/faculty/${assessmentId}/evaluations`)).data;
}
export async function getAssessmentEvaluation(assessmentId: number, attemptId: number): Promise<FacultyEvaluationAttempt> {
  return (await api.get<FacultyEvaluationAttempt>(`/assessments/faculty/${assessmentId}/evaluations/${attemptId}`)).data;
}
export async function gradeAssessmentAnswer(assessmentId: number, attemptId: number, questionId: number, marksAwarded: number, feedback: string): Promise<FacultyEvaluationAttempt> {
  return (await api.put<FacultyEvaluationAttempt>(`/assessments/faculty/${assessmentId}/evaluations/${attemptId}/answers/${questionId}`, { marksAwarded, feedback })).data;
}
