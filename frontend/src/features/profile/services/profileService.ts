import api from "../../../api/axios";
import type { Profile } from "../types/profile";

export async function getProfile() {
    const response = await api.get<Profile>("/user/profile");
    return response.data;
}