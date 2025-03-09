import { Socket } from "socket.io";
import { lobbyType } from "../type/state";
import { redisClient } from "../redis/client";
import { handleLeaveLobby } from "../helpers/lobby";

const removeUserFromSocketMappings = async (socketId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socketId}:userId`
        );

        if (!userId) return null;

        const tx = redisClient.multi();
        tx.del(`chess-app:socketId:${socketId}:userId`);
        tx.del(`chess-app:userId:${userId}:socketId`);

        const result = await tx.exec();
        return result ? userId : null;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const handleUserLeavingLobby = async (
    userId: string,
    lobbyId: string,
    socket: Socket
) => {
    try {
        const tx = redisClient.multi();
        tx.del(`chess-app:userId:${userId}:lobbyId`);

        const lobbyJSON = await redisClient.get(
            `chess-app:lobbyId:${lobbyId}:lobby`
        );
        if (!lobbyJSON) return;

        const lobby: lobbyType = JSON.parse(lobbyJSON);
        if (!lobby) return;

        if (lobby.players.includes(userId)) {
            lobby.players = lobby.players.filter(
                (playerId: string) => playerId !== userId
            );
            socket.leave(lobbyId);

            if (lobby.players.length === 0) {
                lobby.emptySince = Date.now();
            } else if (lobby.hostId === userId) {
                lobby.hostId = lobby.players[0];
            }

            tx.set(`chess-app:lobbyId:${lobbyId}:lobby`, JSON.stringify(lobby));
        }

        const result = await tx.exec();
        if (result) {
            redisClient.publish(
                `chess-app:lobby-update:${lobbyId}`,
                JSON.stringify(lobby)
            );
        }
    } catch (err) {
        console.error(err);
    }
};

export const onDisconnect = async (socket: Socket) => {
    try {
        const userId = await removeUserFromSocketMappings(socket.id);
        if (!userId) return;

        const userLobbyId = await redisClient.get(
            `chess-app:userId:${userId}:lobbyId`
        );
        if (userLobbyId) {
            await handleLeaveLobby(
                socket,
                userId,
                userLobbyId,
                "leave-lobby-error"
            );
        }
    } catch (err) {
        console.error(err);
    }
};
