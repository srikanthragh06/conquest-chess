import { AxiosError, AxiosResponse } from "axios";
import client from "./client";

export const getUserApi = async (username: string) => {
    try {
        const res: AxiosResponse = await client.get(`/user/${username}`);
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};

export const userGamesApi = async (
    username: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        const res: AxiosResponse = await client.get(
            `/user/user-games/${username}${
                page || limit ? `?page=${page ?? ""}&limit=${limit ?? ""}` : ""
            }`
        );
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};
