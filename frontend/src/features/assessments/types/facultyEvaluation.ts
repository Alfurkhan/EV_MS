export type AttemptStatus = "SUBMITTED" | "AUTO_SUBMITTED";
export interface FacultyEvaluationAnswer {
  questionId: number; questionText: string; questionType: string; options: string[] | null;
  correctAnswer: unknown; submittedAnswer: unknown; maximumMarks: number;
  marksAwarded: number | null; feedback: string | null; manualEvaluation: boolean;
}
export interface FacultyEvaluationAttempt {
  attemptId: number; assessmentId: number; assessmentTitle: string; studentName: string;
  studentUsername: string; status: AttemptStatus; startedAt: string; submittedAt: string | null;
  score: number | null; totalMarks: number; evaluationComplete: boolean;
  answers: FacultyEvaluationAnswer[];
}
