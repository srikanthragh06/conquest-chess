import {
    consoleLogGreen,
    consoleLogRed,
    consoleLogBlue,
} from "./colorConsoleLogging";
import { Request, Response, NextFunction } from "express";
import { IncomingHttpHeaders } from "http";

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
 * Logs a message to the console for events related to socket connections.
 * @param eventType The type of event that occurred (e.g. "connection", "disconnect", etc.)
 * @param details Additional details about the event
 */
export const logSocket = (eventType: string, details: string): void => {
    const timestamp = new Date().toISOString(); // Use ISO format for better compatibility
    const logMsg = `[SOCKET] | ${timestamp} | Event: ${eventType} | Details: ${details}`;

    // Log the message in blue color
    consoleLogBlue(logMsg);
};
