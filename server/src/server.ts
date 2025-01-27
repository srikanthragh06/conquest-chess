import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

export const app = express();
export const server = http.createServer(app);

export const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
    path: "/socket",
});
