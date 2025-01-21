import { Request, Response } from "express";
import { logResponse } from "./logging";

/**
 * Sends a response to the client indicating that the request was invalid.
 * @param req The Request object.
 * @param res The Response object.
 * @param errMsg The error message to send to the client. Defaults to "Invalid Request".
 * @param statusCode The HTTP status code to send. Defaults to 400.
 * @returns The Response object.
 */
export const sendClientSideError = (
    req: Request,
    res: Response,
    errMsg: string = "Invalid Request",
    statusCode: number = 400
) => {
    logResponse(req, errMsg, statusCode);
    return res.status(statusCode).json({ error: errMsg });
};

/**
 * Sends a response to the client indicating that a server-side error has occurred.
 * @param req The Request object.
 * @param res The Response object.
 * @param err The Error object that was caught.
 * @param statusCode The HTTP status code to send. Defaults to 500.
 * @returns The Response object.
 */
export const sendServerSideError = (
    req: Request,
    res: Response,
    err: Error,
    statusCode: number = 500
) => {
    logResponse(req, "Server Side Error", statusCode, err);
    return res.status(statusCode).json({ error: "Server Side Error" });
};

/**
 * Sends a successful response to the client.
 * @param req The Request object.
 * @param res The Response object.
 * @param message The success message to send to the client. Defaults to "Request Successful".
 * @param statusCode The HTTP status code to send. Defaults to 200.
 * @param additionals Additional data to include in the response.
 * @returns The Response object.
 */
export const sendSuccessResponse = (
    req: Request,
    res: Response,
    message: string = "Request Successful",
    statusCode: number = 200,
    additionals: Record<string, any> = {}
) => {
    logResponse(req, message, statusCode);
    return res.status(statusCode).json({ message, ...additionals });
};
