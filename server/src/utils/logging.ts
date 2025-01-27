import {
    consoleLogGreen,
    consoleLogRed,
    consoleLogBlue,
} from "./colorConsoleLogging";
import { Request, Response, NextFunction } from "express";
import { IncomingHttpHeaders } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

/**
 * Gets the client IP address from the request headers.
 * @param headers The request headers.
 * @param socketAddress The remote address of the socket.
 * @returns The client IP address.
 */
const getClientIP = (
    headers: IncomingHttpHeaders,
    socketAddress?: string
): string => {
    // Check if the X-Forwarded-For header is present
    const xForwardedFor = headers["x-forwarded-for"];
    if (typeof xForwardedFor === "string") {
        // If it is a string, split the string by commas and return the first IP address
        return xForwardedFor.split(",")[0].trim();
    } else if (Array.isArray(xForwardedFor)) {
        // If it is an array, return the first IP address in the array
        return xForwardedFor[0].trim();
    }
    // If the X-Forwarded-For header is not present, use the socket's remote address
    return socketAddress || "Unknown IP";
};

/**
 * Logs a request to the console with a blue color.
 * @param req The request.
 * @param _ The response (not used).
 * @param next The next middleware function.
 */
export const logRequest = (
    req: Request,
    _: Response,
    next: NextFunction
): void => {
    const clientIP = getClientIP(req.headers, req.socket.remoteAddress);
    const timestamp = new Date().toLocaleString();

    // Log the request in the format:
    // REQUEST | Client IP | Timestamp | Method | URL
    consoleLogBlue(
        `REQUEST | ${clientIP} | ${timestamp} | ${req.method} | ${req.originalUrl}`
    );
    // Call the next middleware function
    next();
};

/**
 * Logs the response details to the console.
 * @param req The request object.
 * @param resMessage The response message to log.
 * @param statusCode The status code of the response. Defaults to 200.
 * @param serverError An optional error object for server-side errors.
 */
export const logResponse = (
    req: Request,
    resMessage: string,
    statusCode = 200,
    serverError: Error | null = null
): void => {
    const clientIP = getClientIP(req.headers, req.socket.remoteAddress);
    const timestamp = new Date().toLocaleString();
    // Construct the log message with relevant details
    const logMsg = `RESPONSE | ${clientIP} | ${statusCode} | ${timestamp} | ${req.method} | ${req.originalUrl} | ${resMessage}`;

    // Log successful responses in green
    if (statusCode >= 200 && statusCode < 300) {
        consoleLogGreen(logMsg);
    } else {
        // Log error responses in red
        consoleLogRed(logMsg);
    }
};

/**
 * Logs when an event is registered on a socket.
 * @param socket The socket instance on which the event is registered.
 * @param event The name of the event being registered.
 */
export const logSocketOn = (socket: Socket, event: string) => {
    // Capture the current timestamp
    const timestamp = new Date().toLocaleString();

    // Log the event registration details in blue
    consoleLogBlue(
        `ON SOCKET | ${socket.id} | ${timestamp} | ${event} | ${timestamp}`
    );
};

/**
 * Logs when an event is emitted on a socket.
 * @param socket The socket instance on which the event is emitted.
 * @param event The name of the event being emitted.
 * @param data The data being sent with the event.
 * @param isError Whether the event was emitted due to an error.
 */
export const logSocketEmit = (
    socket: Socket,
    event: string,
    data: any = null,
    isError = false
) => {
    const timestamp = new Date().toLocaleString();
    if (isError) {
        consoleLogRed(
            `EMIT SOCKET | ${
                socket.id
            } | ${timestamp} | ${event} | ${timestamp} | ${data || ""}`
        );
    } else {
        consoleLogGreen(
            `EMIT SOCKET | ${socket.id} | ${timestamp} | ${event} | ${timestamp}`
        );
    }
};

/**
 * Logs when an event is emitted on a room.
 * @param roomId The ID of the room on which the event is emitted.
 * @param event The name of the event being emitted.
 * @param data The data being sent with the event.
 * @param isError Whether the event was emitted due to an error.
 */
export const logSocketEmitRoom = (
    roomId: string,
    event: string,
    data: any = null,
    isError = false
) => {
    const timestamp = new Date().toLocaleString();
    if (isError) {
        // Log the event registration details in red
        consoleLogRed(
            `EMIT ROOM | ${roomId} | ${timestamp} | ${event} | ${timestamp} | ${
                data || ""
            }`
        );
    } else {
        // Log the event registration details in green
        consoleLogGreen(
            `EMIT ROOM | ${roomId} | ${timestamp} | ${event} | ${timestamp}`
        );
    }
};
