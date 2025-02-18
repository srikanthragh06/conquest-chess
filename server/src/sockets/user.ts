import { Socket } from "socket.io";
import { transaction } from "../db/postgres";
import { findOneWithCondition, updateRecords } from "../db/queries";
import { socketEmit } from "../utils/responseTemplates";
import jwt from "jsonwebtoken";
import { redisClient } from "../redis/client";

const handleGuestUser = async (decodedToken: any): Promise<string> => {
    const { guestId } = decodedToken;
    if (!guestId) {
        throw new Error("Invalid auth token, user not found");
    }

    const guest = await redisClient.get(`guestId:${guestId}:guest`);
    if (!guest) {
        throw new Error("Invalid auth token, user not found");
    }

    return `Guest_${guestId}`;
};

// Handle registered user registration
const handleRegisteredUser = async (decodedToken: any): Promise<string> => {
    const { username, updatePasswordToken } = decodedToken;

    if (!username || !updatePasswordToken) {
        throw new Error("Invalid auth token, user not found");
    }

    await transaction(async (client) => {
        const user = await findOneWithCondition(client, "Users", null, {
            username,
        });

        if (!user) {
            throw new Error("Invalid auth token, user not found");
        }

        if (updatePasswordToken !== user.update_password_token) {
            throw new Error("Please sign in with your new password");
        }

        await updateRecords(
            client,
            "Users",
            { last_active: new Date() },
            { username }
        );
    });

    return username;
};

export const onRegisterUser = async (jwtToken: string, socket: Socket) => {
    try {
        if (!jwtToken) {
            return socketEmit(
                socket,
                "register-user-error",
                "No JWT token provided",
                true
            );
        }

        let decodedToken: any;

        try {
            decodedToken = jwt.verify(
                jwtToken,
                process.env.JWT_SECRET_KEY as string
            );
        } catch (error) {
            const errorMessage =
                error instanceof jwt.TokenExpiredError
                    ? "Token expired"
                    : error instanceof jwt.JsonWebTokenError
                    ? "Invalid Authentication Token"
                    : "Unable to parse auth-token";
            return socketEmit(
                socket,
                "register-user-error",
                errorMessage,
                true
            );
        }

        const { isGuest } = decodedToken;
        if (isGuest === undefined) {
            return socketEmit(
                socket,
                "register-user-error",
                "Invalid Authentication Token",
                true
            );
        }

        let userId: string;

        try {
            if (isGuest) {
                userId = await handleGuestUser(decodedToken);
            } else {
                userId = await handleRegisteredUser(decodedToken);
            }
        } catch (error: any) {
            console.error(error);
            return socketEmit(
                socket,
                "register-user-error",
                "Server Error",
                true
            );
        }

        const oldUserId = await redisClient.get(`socketId:${socket.id}:userId`);

        const tx = redisClient.multi();

        if (oldUserId) {
            tx.del(`userId:${oldUserId}:socketId`);
            tx.del(`socketId:${socket.id}:userId`);
        }

        tx.set(`socketId:${socket.id}:userId`, userId);
        tx.set(`userId:${userId}:socketId`, socket.id);

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "register-user-error",
                "Register user failed due to conflict",
                true
            );

        socketEmit(socket, "registered-user");
    } catch (err) {
        console.error(err);
        return socketEmit(socket, "register-user-error", "Server Error", true);
    }
};
