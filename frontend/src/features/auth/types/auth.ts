export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    roles: string[];
    expireAt: number;
    refreshToken: string;
}