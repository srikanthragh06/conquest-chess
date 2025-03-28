import { Socket } from "socket.io";
import { redisClient } from "../redis/client";
import { handleLeaveLobby } from "../helpers/lobby";

const removeUserFromSocketMappings = async (socketId: string) => {
    try {
        await redisClient.watch(`chess-app:socketId:${socketId}:userId`);

        const userId = await redisClient.get(
            `chess-app:socketId:${socketId}:userId`
        );

        if (!userId) {
            await redisClient.unwatch();
            return null;
        }

        const tx = redisClient.multi();

        tx.del(`chess-app:socketId:${socketId}:userId`);
        tx.del(`chess-app:userId:${userId}:socketId`);

        const result = await tx.exec();

        return result ? userId : null;
    } catch (err) {
        console.error(err);
        return null;
    } finally {
        await redisClient.unwatch();
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
