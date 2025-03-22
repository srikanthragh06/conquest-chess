import { Socket } from "socket.io";
import { redisClient } from "../redis/client";
import { socketEmit } from "../utils/responseTemplates";
import { startGame } from "../helpers/game";

export const onQueueMatch = async (
    socket: Socket,
    matchType: "Blitz" | "Bullet" | "Rapid"
) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "queue-match-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const queueUserId = await redisClient.get(
            `chess-app:queueMatch:${matchType}:matchType`
        );

        if (!queueUserId) {
            await redisClient.set(
                `chess-app:queueMatch:${matchType}:matchType`,
                userId
            );
            return;
        }

        if (queueUserId === userId)
            return socketEmit(
                socket,
                "queue-match-error",
                `User ${userId} is already queued`,
                true
            );

        const { tx, newGame } = await startGame(redisClient, matchType, [
            queueUserId,
            userId,
        ]);
        const whiteSocketId = await redisClient.get(
            `chess-app:userId:${newGame.whiteId}:socketId`
        );

        const blackSocketId = await redisClient.get(
            `chess-app:userId:${newGame.blackId}:socketId`
        );

        tx.del(`chess-app:queueMatch:${matchType}:matchType`);

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "queue-match-error",
                "Failed to start game due to conflict",
                true
            );

        redisClient.publish(
            `chess-app:started-game:${newGame.gameId}`,
            JSON.stringify({
                gameId: newGame.gameId,
                whiteSocketId,
                blackSocketId,
            })
        );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "queue-match-error", "Failed to queue match", true);
    }
};

export const onCancelQueue = async (socket: Socket) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "cancel-queue-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        ["Blitz", "Rapid", "Bullet"].forEach(async (matchType) => {
            const queueUserId = await redisClient.get(
                `chess-app:queueMatch:${matchType}:matchType`
            );
            if (queueUserId === userId) {
                await redisClient.del(
                    `chess-app:queueMatch:${matchType}:matchType`
                );
            }
        });
    } catch (err) {
        console.error(err);
        socketEmit(socket, "queue-match-error", "Failed to queue match", true);
    }
};
