import axios, { AxiosInstance } from "axios";

const client: AxiosInstance = axios.create({
    baseURL: (import.meta.env.VITE_SERVER_URL as string) + "/api", // Cast to string to ensure TypeScript knows the type
});

export default client;
