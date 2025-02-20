import { io } from "socket.io-client";

const serverURL = import.meta.env.VITE_SERVER_URL as string;
export const socket = io(serverURL, { path: "/socket", autoConnect: false });
