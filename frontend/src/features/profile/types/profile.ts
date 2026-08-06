export interface Profile {
    id: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
    accountEnabled: boolean;
}