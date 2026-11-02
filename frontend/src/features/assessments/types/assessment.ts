export type AssessmentType = "QUIZ" | "UNIT_TEST" | "MID_TERM" | "FINAL_EXAM";
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AssessmentTimingMode = "FIXED_WINDOW" | "INDIVIDUAL_TIMER";
export type AssessmentQuestionType = "MCQ" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "DESCRIPTIVE";

export interface AssessmentQuestionRequest {
    questionText: string;
    questionType: AssessmentQuestionType;
    options?: string[];
    correctAnswer?: unknown;
    marks: number;
    position: number;
}

export interface AssessmentRequest {
    title: string;
    description: string;
    assessmentType: AssessmentType;
    academicYearId: number;
    gradeId: number;
    sectionId: number;
    subjectId: number;
    timingMode: AssessmentTimingMode;
    availableFrom: string;
    availableUntil: string;
    durationMinutes: number | null;
    allowOvertime: boolean;
    questions: AssessmentQuestionRequest[];
}

export interface AssessmentQuestion extends AssessmentQuestionRequest {
    id: number;
}

export interface Assessment {
    id: number;
    title: string;
    description: string | null;
    assessmentType: AssessmentType;
    status: AssessmentStatus;
    academicYearId: number;
    academicYearName: string;
    gradeId: number;
    gradeName: string;
    sectionId: number;
    sectionName: string;
    subjectId: number;
    subjectName: string;
    timingMode: AssessmentTimingMode;
    availableFrom: string;
    availableUntil: string;
    durationMinutes: number | null;
    allowOvertime: boolean;
    totalMarks: number;
    questions: AssessmentQuestion[];
    createdAt: string;
    updatedAt: string;
}
