import api from "../../../api/axios";
import type { Profile } from "../types/profile";

export async function getProfile() {
    const response = await api.get<Profile>("/user/profile");
    return response.data;
}

export async function updateProfile(data: {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
}) {
    const response = await api.put<Profile>(
        "/user/profile",
        data
    );

    return response.data;
}