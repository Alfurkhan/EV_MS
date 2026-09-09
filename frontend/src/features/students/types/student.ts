import type { StudentEnrollment } from "../../academic/services/studentEnrollmentService";

export interface Student {
    id: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;

    accountEnabled: boolean;
    accountLocked: boolean;
    emailVerified: boolean;

    enrollment: StudentEnrollment | null;
}