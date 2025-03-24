import { io } from "../server";
import { gameType, lobbyType, movesType } from "../type/state";
import { socketEmitRoom } from "../utils/responseTemplates";
import { redisClient } from "./client";

export const onSubscribePMessage = async (
    pattern: string,
    channel: string,
    message: string
) => {
    try {
        // Validate channel structure before splitting
        const channelParts = channel.split(":");
        if (channelParts.length < 3) {
            console.error(
                `[Redis PubSub Error] Invalid channel format: ${channel}`
            );
            return;
        }

        if (channel.startsWith("chess-app:lobby-update")) {
            try {
                const lobbyId = channelParts[2];
                const lobby: lobbyType = JSON.parse(message);
                socketEmitRoom(io, lobbyId, "lobby-details", lobby);
            } catch (err) {
                console.error(
                    `[Redis PubSub Error] Failed to process 'lobby-update' event on channel ${channel} with message: ${message}. Error:`,
                    err
                );
            }
        } else if (channel.startsWith("chess-app:started-game")) {
            try {
                const { gameId, lobbyId, whiteSocketId, blackSocketId } =
                    JSON.parse(message);

                const whiteSocket = io.sockets.sockets.get(whiteSocketId);
                if (whiteSocket) {
                    if (gameId) whiteSocket.join(gameId);
                    if (lobbyId) whiteSocket.leave(lobbyId);
                } else {
                    console.warn(
                        `[Redis PubSub Warning] White player socket not found for game ${gameId} on channel ${channel}`
                    );
                }

                const blackSocket = io.sockets.sockets.get(blackSocketId);
                if (blackSocket) {
                    if (gameId) blackSocket.join(gameId);
                    if (lobbyId) blackSocket.leave(lobbyId);
                } else {
                    console.warn(
                        `[Redis PubSub Warning] Black player socket not found for game ${gameId} on channel ${channel}`
                    );
                }

                socketEmitRoom(io, gameId, "started-game", gameId);
            } catch (err) {
                console.error(
                    `[Redis PubSub Error] Failed to process 'started-game' event on channel ${channel} with message: ${message}. Error:`,
                    err
                );
            }
        } else if (channel.startsWith("chess-app:game-over")) {
            try {
                const gameId = channelParts[2];
                const { game, moves }: { game: gameType; moves: movesType } =
                    JSON.parse(message);
                socketEmitRoom(io, gameId, "game-over", { game, moves });
            } catch (err) {
                console.error(
                    `[Redis PubSub Error] Failed to process 'game-over' event on channel ${channel} with message: ${message}. Error:`,
                    err
                );
            }
        } else if (channel.startsWith("chess-app:game-update")) {
            try {
                const gameId = channelParts[2];
                const { game, moves }: { game: gameType; moves: movesType } =
                    JSON.parse(message);
                socketEmitRoom(io, gameId, "game-update", { game, moves });
            } catch (err) {
                console.error(
                    `[Redis PubSub Error] Failed to process 'game-update' event on channel ${channel} with message: ${message}. Error:`,
                    err
                );
            }
        } else if (channel.startsWith("chess-app:request-draw")) {
            try {
                const gameId = channelParts[2];
                const userId = message;
                const socketId = await redisClient.get(
                    `chess-app:userId:${userId}:socketId`
                );

                if (socketId) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit("request-draw", gameId);
                    } else {
                        console.warn(
                            `[Redis PubSub Warning] Socket not found for user ${userId} on game ${gameId}. Channel: ${channel}`
                        );
                    }
                } else {
                    console.warn(
                        `[Redis PubSub Warning] No socket ID found in Redis for user ${userId} on channel ${channel}`
                    );
                }
            } catch (err) {
                console.error(
                    `[Redis PubSub Error] Failed to process 'request-draw' event on channel ${channel} with message: ${message}. Error:`,
                    err
                );
            }
        }
    } catch (err) {
        console.error(
            `[Redis PubSub Critical Error] General error while processing published message on channel ${channel} with message: ${message}. Error:`,
            err
        );
    }
};
