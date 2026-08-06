import api from "../../../api/axios";

export const login = async (data: {
    userName: string;
    password: string;
}) => {
    const response = await api.post("/auth/login", data);

    return response.data;
};