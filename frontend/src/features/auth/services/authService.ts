import api from "../../../api/axios";

export const login = async (data: {
    userName: string;
    password: string;
}) => {
    const response = await api.post("/auth/login", data);

    return response.data;
};


export const sendRegistrationOtp = async (data: {
    email: string;
}) => {
    const response = await api.post(
        "/auth/send/email",
        data
    );

    return response.data;
};


export const verifyRegistrationOtp = async (data: {
    email: string;
    otp: string;
}) => {
    const response = await api.post(
        "/auth/verify-registration-otp",
        data
    );

    return response.data;
};


export const register = async (data: {
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
    password: string;
    platform: "FACEBOOK" | "GMAIL" | "NONE";
    roleName:
        | "ROLE_STUDENT"
        | "ROLE_FACULTY"
        | "ROLE_ADMIN";
}) => {
    const response = await api.post(
        "/auth/register/user",
        data
    );

    return response.data;
};