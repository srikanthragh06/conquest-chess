import { Request, Response } from "express";
import { logResponse, logSocketEmit, logSocketEmitRoom } from "./logging";
import { Server as SocketIOServer, Socket } from "socket.io";

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

/**
 * Emits an event to the given socket.
 * @param socket The socket to emit the event to.
 * @param event The name of the event to emit.
 * @param data The data to send with the event. Defaults to null.
 * @param isError Whether the event is an error event. Defaults to false.
 */
export const socketEmit = (
    socket: Socket,
    event: string,
    data: any = null,
    isError = false
) => {
    logSocketEmit(socket, event, data, isError);
    socket.emit(event, data);
};

/**
 * Emits an event to all the sockets in the given room.
 * @param io The Socket.IO server.
 * @param roomId The ID of the room to emit the event to.
 * @param event The name of the event to emit.
 * @param data The data to send with the event. Defaults to null.
 * @param isError Whether the event is an error event. Defaults to false.
 */
export const socketEmitRoom = (
    io: SocketIOServer,
    roomId: string,
    event: string,
    data: any = null,
    isError = false
) => {
    logSocketEmitRoom(roomId, event, data, isError);
    io.to(roomId).emit(event, data);
};
