import express from "express";
import http from "http";
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

const app = express();
const server = http.createServer(app);

dotenv.config();

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use(logRequest);

app.use(incorrectJSONFormatHandler);

// main routes
app.get("/", (req, res) => {
    throw new Error("new error");
    res.send("Hello World!");
});

app.use("/api/auth", authRouter);

app.use("/*", urlNotFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.SERVER_PORT;
server.listen(PORT, () => {
    consoleLogCyan(`Server is running on localhost: ${PORT}`);
    testDatabaseConnection();
});
