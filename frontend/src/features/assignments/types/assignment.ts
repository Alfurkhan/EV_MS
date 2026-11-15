export type AssignmentStatus = "DRAFT" | "PUBLISHED";

export interface Assignment {
    id: number;
    title: string;
    instructions: string;
    academicYearId: number;
    academicYearName: string;
    gradeId: number;
    gradeName: string;
    sectionId: number;
    sectionName: string;
    subjectId: number;
    subjectName: string;
    subjectCode: string;
    facultyId: number;
    facultyName: string;
    dueAt: string;
    status: AssignmentStatus;
    hasAttachment: boolean;
    attachmentName: string | null;
    submissionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AssignmentSubmission {
    id: number;
    assignmentId: number;
    assignmentTitle: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    responseText: string | null;
    submittedAt: string | null;
    late: boolean;
    marks: number | null;
    maxMarks: number | null;
    feedback: string | null;
    gradedAt: string | null;
    hasAttachment: boolean;
    attachmentName: string | null;
    updatedAt: string;
}

export interface AssignmentRequest {
    title: string;
    instructions: string;
    academicYearId: number;
    gradeId: number;
    sectionId: number;
    subjectId: number;
    dueAt: string;
}

export interface AssignmentSubmissionRequest {
    responseText: string;
}

export interface AssignmentGradeRequest {
    marks: number;
    maxMarks: number;
    feedback?: string;
}
