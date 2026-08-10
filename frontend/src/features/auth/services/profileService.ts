import api from "../../../api/axios";

export const getProfile = async () => {
    const response = await api.get("/user/profile");
    return response.data;
};

export const updateProfile = async (data: {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
}) => {

    const response = await api.put("/user/profile", data);

    return response.data;

};