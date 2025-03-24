import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { consoleLogCyan } from "./utils/colorConsoleLogging";
import bodyParser from "body-parser";
import {
    globalErrorHandler,
    incorrectJSONFormatHandler,
    urlNotFoundHandler,
} from "./middlewares/handlers";
import { logRequest } from "./utils/logging";
import dotenv from "dotenv";
import { testDatabaseConnection } from "./db/postgres";
import authRouter from "./routers/auth";
import userRouter from "./routers/user";
import { handleIOConnection } from "./sockets/main";
import { app, io, server } from "./server";
import { testRedisConnection } from "./redis/client";
import { sendSuccessResponse } from "./utils/responseTemplates";

dotenv.config();

io.on("connection", handleIOConnection);

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.MODE === "dev" && process.env.CLIENT_URL) {
    app.use(cors({ origin: process.env.CLIENT_URL }));
} else if (
    process.env.MODE === "prod" &&
    process.env.CLIENT_URL_1 &&
    process.env.CLIENT_URL_2
) {
    app.use(
        cors({ origin: [process.env.CLIENT_URL_1, process.env.CLIENT_URL_2] })
    );
} else {
    throw new Error("Invalid MODE: CORS is not configured.");
}

app.use(logRequest);

app.use(incorrectJSONFormatHandler);

// main routes
app.get("/api/hi", (req: Request, res: Response, next: NextFunction) => {
    try {
        return sendSuccessResponse(req, res, "Hey!");
    } catch (err) {
        next(err);
    }
});
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use("/*", urlNotFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.SERVER_PORT;
server.listen(PORT, () => {
    consoleLogCyan(`Server is running on localhost: ${PORT}`);
    testDatabaseConnection();
    testRedisConnection();
});
