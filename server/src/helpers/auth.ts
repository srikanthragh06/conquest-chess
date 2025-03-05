import crypto from "crypto";
import { redisClient } from "../redis/client";
import { gameType, guestType } from "../type/state";
import { Socket } from "socket.io";
import { transaction } from "../db/postgres";
import { findOneWithCondition, updateRecords } from "../db/queries";

export const createGuestInRedis = async () => {
    const generateGuestId = () => {
        return crypto.randomBytes(12).toString("base64url").slice(0, 16);
    };

    let newGuestId: string;
    let guestIdExists = true;

    do {
        newGuestId = "Guest_" + generateGuestId();
        const guestJSON = await redisClient.get(
            `chess-app:guestId:${newGuestId}:guest`
        );
        guestIdExists = guestJSON ? true : false;
    } while (guestIdExists);

    const newGuest: guestType = {
        guestId: newGuestId,
        createdAt: Date.now(),
    };

    const tx = redisClient.multi();
    tx.set(`chess-app:guestId:${newGuestId}:guest`, JSON.stringify(newGuest));
    tx.expire(`chess-app:guestId:${newGuestId}:guest`, 7 * 24 * 60 * 60);

    const result = await tx.exec();
    if (result) return newGuest.guestId;
    throw new Error("Failed to create guest");
};

export const addUser2SocketList = async (userId: string, socket: Socket) => {
    const oldUserId = await redisClient.get(
        `chess-app:socketId:${socket.id}:userId`
    );

    const tx = redisClient.multi();

    if (oldUserId) {
        tx.del(`chess-app:userId:${oldUserId}:socketId`);
        tx.del(`chess-app:socketId:${socket.id}:userId`);
    }

    tx.set(`chess-app:socketId:${socket.id}:userId`, userId);
    tx.set(`chess-app:userId:${userId}:socketId`, socket.id);

    const result = await tx.exec();
    if (!result) throw new Error("Failed to register user");
};

export const handleJoinOldGame = async (socket: Socket, userId: string) => {
    const gameId = await redisClient.get(`chess-app:userId:${userId}:gameId`);
    if (gameId) {
        const gameJSON = await redisClient.get(
            `chess-app:gameId:${gameId}:game`
        );
        if (gameJSON) {
            const game: gameType = JSON.parse(gameJSON);

            if (game.gameStatus.status === "playing") {
                socket.join(gameId);
            }
        }
    }
};

export const verifyGuestIdInJWT = async (decodedToken: any) => {
    const { userId }: { userId: string } = decodedToken;
    if (typeof userId !== "string" || !userId.startsWith("Guest_"))
        throw new Error("Invalid auth token, user not found");

    const guestJSON = await redisClient.get(
        `chess-app:guestId:${userId}:guest`
    );
    if (!guestJSON) return false;

    return userId;
};

// Handle registered user registration
export const handleRegisteredUser = async (
    decodedToken: any
): Promise<string> => {
    const { userId, updatePasswordToken } = decodedToken;

    if (!userId || !updatePasswordToken) {
        throw new Error("Invalid auth token, user not found");
    }

    await transaction(async (client) => {
        const user = await findOneWithCondition(client, "Users", null, {
            username: userId,
        });

        if (!user) throw new Error("Invalid auth token, user not found");

        if (updatePasswordToken !== user.update_password_token)
            throw new Error("Please sign in with your new password");

        await updateRecords(
            client,
            "Users",
            { last_active: new Date() },
            { username: userId }
        );
    });

    return userId;
};
