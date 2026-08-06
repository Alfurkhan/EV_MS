export interface Student {
    id: number;
    admissionNo: string;
    name: string;
    email: string;
    grade: string;
    section: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE";
}