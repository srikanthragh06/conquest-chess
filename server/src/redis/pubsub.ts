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
        // lobby-update
        if (channel.startsWith("lobby-update")) {
            const lobbyId = channel.split(":")[1];
            const lobby: lobbyType = JSON.parse(message);

            socketEmitRoom(io, lobbyId, "lobby-details", lobby);
        }
        // match-select
        else if (channel.startsWith("match-select")) {
            const lobbyId = channel.split(":")[1];
            const matchType = message;
            socketEmitRoom(io, lobbyId, "match-select", matchType);
        }
        // started-game
        else if (channel.startsWith("started-game")) {
            const { gameId, lobbyId, whiteSocketId, blackSocketId } =
                JSON.parse(message);

            const whiteSocket = io.sockets.sockets.get(whiteSocketId);
            if (whiteSocket) {
                if (gameId) whiteSocket.join(gameId);
                if (lobbyId) whiteSocket.leave(lobbyId);
            }
            const blackSocket = io.sockets.sockets.get(blackSocketId);
            if (blackSocket) {
                if (gameId) blackSocket.join(gameId);
                if (lobbyId) blackSocket.leave(lobbyId);
            }

            socketEmitRoom(io, gameId, "started-game", gameId);
        }
        // game-over
        else if (channel.startsWith("game-over")) {
            const gameId = channel.split(":")[1];
            const { game, moves }: { game: gameType; moves: movesType } =
                JSON.parse(message);

            socketEmitRoom(io, gameId, "game-over", {
                game,
                moves,
            });
        }
        // game-update
        else if (channel.startsWith("game-update")) {
            const gameId = channel.split(":")[1];
            const { game, moves }: { game: gameType; moves: movesType } =
                JSON.parse(message);

            socketEmitRoom(io, gameId, "game-update", {
                game,
                moves,
            });
        }
        // request-draw
        else if (channel.startsWith("request-draw")) {
            const gameId = channel.split(":")[1];
            const userId = message;
            const socketId = await redisClient.get(
                `chess-app:userId:${userId}:socketId`
            );
            if (socketId) {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.emit("request-draw", gameId);
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
};
