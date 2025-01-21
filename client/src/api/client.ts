import axios, { AxiosInstance } from "axios";

// Create an Axios instance
const client: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string, // Cast to string to ensure TypeScript knows the type
});

export default client;
