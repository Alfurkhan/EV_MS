export interface Faculty {
    id: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;
    accountEnabled: boolean;
    accountLocked: boolean;
    emailVerified: boolean;
}