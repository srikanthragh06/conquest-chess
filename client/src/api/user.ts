import { AxiosError, AxiosResponse } from "axios";
import client from "./client";

export const getUserApi = async (userId: string) => {
    try {
        const res: AxiosResponse = await client.get(`/user/${userId}`);
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};
