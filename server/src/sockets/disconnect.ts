import { Socket } from "socket.io";
import { lobbyType } from "../state/state";
import { redisClient } from "../redis/client";

const removeUserFromSocketMappings = async (socketId: string) => {
    try {
        const userId = await redisClient.get(`socketId:${socketId}:userId`);

        if (!userId) return null;

        const tx = redisClient.multi();
        tx.del(`socketId:${socketId}:userId`);
        tx.del(`userId:${userId}:socketId`);

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
        tx.del(`userId:${userId}:lobbyId`);

        const lobbyJSON = await redisClient.get(`lobbyId:${lobbyId}:lobby`);
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

            tx.set(`lobbyId:${lobbyId}:lobby`, JSON.stringify(lobby));
        }

        const result = await tx.exec();
        if (result) {
            redisClient.publish(
                `lobby:${lobbyId}:update`,
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

        const userLobbyId = await redisClient.get(`userId:${userId}:lobbyId`);
        if (userLobbyId) {
            await handleUserLeavingLobby(userId, userLobbyId, socket);
        }
    } catch (err) {
        console.error(err);
    }
};
