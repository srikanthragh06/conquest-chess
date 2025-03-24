import { Socket } from "socket.io";
import { executeWithRetry, redisClient } from "../redis/client";
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

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:queueMatch:${matchType}:matchType`],
            async (tx) => {
                const queueUserId = await redisClient.get(
                    `chess-app:queueMatch:${matchType}:matchType`
                );

                if (!queueUserId) {
                    tx.set(
                        `chess-app:queueMatch:${matchType}:matchType`,
                        userId
                    );
                    return {};
                }

                if (queueUserId === userId) {
                    socketEmit(
                        socket,
                        "queue-match-error",
                        `User ${userId} is already queued`,
                        true
                    );
                    return null;
                }

                const newGame = await startGame(tx, matchType, [
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

                return { newGame, whiteSocketId, blackSocketId };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "queue-match-error",
                "Failed to start game due to conflict",
                true
            );

        const { newGame, whiteSocketId, blackSocketId } = result;

        if (newGame && whiteSocketId && blackSocketId)
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

        await executeWithRetry(
            redisClient,
            [
                `chess-app:queueMatch:Blitz:matchType`,
                `chess-app:queueMatch:Rapid:matchType`,
                `chess-app:queueMatch:Bullet:matchType`,
            ],
            async (tx) => {
                for (const matchType of ["Blitz", "Rapid", "Bullet"]) {
                    const queueUserId = await redisClient.get(
                        `chess-app:queueMatch:${matchType}:matchType`
                    );
                    if (queueUserId === userId)
                        tx.del(`chess-app:queueMatch:${matchType}:matchType`);
                }
            }
        );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "queue-match-error", "Failed to queue match", true);
    }
};
