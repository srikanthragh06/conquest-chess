import { Socket } from "socket.io";
import { redisClient } from "../redis/client";
import { socketEmit } from "../utils/responseTemplates";
import { lobbyType } from "../type/state";
import { executeWithRetry } from "../redis/client";

export const handleLeaveLobby = async (
    socket: Socket,
    userId: string,
    lobbyId: string,
    errorEvent: string
) => {
    const lobby = await executeWithRetry(
        redisClient,
        [
            `chess-app:userId:${userId}:lobbyId`,
            `chess-app:lobbyId:${lobbyId}:lobby`,
        ],
        async (tx) => {
            const lobbyJSON = await redisClient.get(
                `chess-app:lobbyId:${lobbyId}:lobby`
            );
            if (!lobbyJSON)
                return socketEmit(
                    socket,
                    errorEvent,
                    `Lobby with ID ${lobbyId} does not exist`,
                    true
                );

            const lobby: lobbyType = JSON.parse(lobbyJSON);
            lobby.players = lobby.players.filter(
                (playerId) => playerId !== userId
            );
            lobby.participants[0] =
                lobby.participants[0] === userId ? null : lobby.participants[0];
            lobby.participants[1] =
                lobby.participants[1] === userId ? null : lobby.participants[1];

            if (lobby.hostId === userId) {
                lobby.hostId = lobby.players[0];
            }

            tx.del(`chess-app:userId:${userId}:lobbyId`);
            tx.set(`chess-app:lobbyId:${lobbyId}:lobby`, JSON.stringify(lobby));

            if (lobby.players.length === 0)
                tx.expire(`chess-app:lobbyId:${lobbyId}:lobby`, 5 * 60);

            return lobby;
        }
    );

    socket.leave(lobbyId);

    redisClient.publish(
        `chess-app:lobby-update:${lobbyId}`,
        JSON.stringify(lobby)
    );
};
