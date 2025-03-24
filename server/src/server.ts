import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
export const server = http.createServer(app);

let allowedOrigins: string | string[];

if (process.env.MODE === "dev" && process.env.CLIENT_URL) {
    allowedOrigins = process.env.CLIENT_URL;
} else if (
    process.env.MODE === "prod" &&
    process.env.CLIENT_URL_1 &&
    process.env.CLIENT_URL_2
) {
    allowedOrigins = [process.env.CLIENT_URL_1, process.env.CLIENT_URL_2];
} else {
    throw new Error("Invalid MODE: CORS is not configured properly.");
}

export const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
    path: "/socket",
});
