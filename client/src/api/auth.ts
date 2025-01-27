import { AxiosError, AxiosResponse } from "axios";
import client from "./client";

export const signupApi = async (
    email: string,
    username: string,
    password: string
) => {
    try {
        const res: AxiosResponse = await client.post("/auth/signup", {
            email,
            username,
            password,
        });
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};

export const loginWithEmailApi = async (email: string, password: string) => {
    try {
        const res: AxiosResponse = await client.post("/auth/login", {
            email,
            password,
        });
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};

export const loginWithUsernameApi = async (
    username: string,
    password: string
) => {
    try {
        const res: AxiosResponse = await client.post("/auth/login", {
            username,
            password,
        });
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};

export const isAuthApi = async (token: string) => {
    try {
        const res: AxiosResponse = await client.get("/auth/is-auth", {
            headers: {
                Authorization: `Bearer ${token}`,
                accept: "application/json",
            },
        });
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};

export const createGuestApi = async () => {
    try {
        const res: AxiosResponse = await client.post("/auth/create-guest");
        return res;
    } catch (err) {
        const error = err as AxiosError;
        return error.response;
    }
};
