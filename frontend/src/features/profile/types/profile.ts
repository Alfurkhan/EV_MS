export interface Profile {
    id: number;

    username: string;

    fullName: string;

    email: string;

    countryCode: string | null;

    phoneNumber: string | null;

    registeredSource: string | null;

    accountEnabled: boolean;

    accountLocked: boolean;

    createdAt: string;

    updatedAt: string;

    lastLoginAt: string;

    emailVerified: boolean;

    termPolicyViewed: boolean;

    role: string | null;
}