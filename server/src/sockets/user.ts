import { Socket } from "socket.io";
import { socketEmit } from "../utils/responseTemplates";
import jwt from "jsonwebtoken";
import {
    addUser2SocketList,
    createGuestInRedis,
    handleJoinOldGame,
    handleRegisteredUser,
    verifyGuestIdInJWT,
} from "../helpers/auth";
import { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../redis/client";

export const onRegisterUser = async (authToken: string, socket: Socket) => {
    try {
        let userId: string;
        let newAuthToken: string;
        let isGuest: boolean;

        // If no JWT token, create a guest
        if (!authToken) {
            userId = await createGuestInRedis();
            isGuest = true;
            newAuthToken = jwt.sign(
                { userId, isGuest: true },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "168h" }
            );
        } else {
            let decodedToken: JwtPayload | string | null = null;

            try {
                decodedToken = jwt.verify(
                    authToken,
                    process.env.JWT_SECRET_KEY as string
                ) as JwtPayload;
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    try {
                        decodedToken = jwt.decode(authToken) as JwtPayload;
                    } catch {
                        return socketEmit(
                            socket,
                            "register-user-error",
                            "Invalid Authentication Token",
                            true
                        );
                    }

                    if (!decodedToken || decodedToken.isGuest === undefined) {
                        return socketEmit(
                            socket,
                            "register-user-error",
                            "Invalid Authentication Token",
                            true
                        );
                    }

                    if (!decodedToken.isGuest) {
                        return socketEmit(
                            socket,
                            "register-user-error",
                            "Authentication token expired, please log in again",
                            true
                        );
                    }

                    // Guest token expired, create a new guest
                    userId = await createGuestInRedis();
                    isGuest = true;
                    newAuthToken = jwt.sign(
                        { userId, isGuest: true },
                        process.env.JWT_SECRET_KEY as string,
                        { expiresIn: "168h" }
                    );
                } else {
                    return socketEmit(
                        socket,
                        "register-user-error",
                        "Invalid Authentication Token",
                        true
                    );
                }
            }
            // Ensure token is valid
            if (
                !decodedToken ||
                typeof decodedToken === "string" ||
                decodedToken.isGuest === undefined
            )
                return socketEmit(
                    socket,
                    "register-user-error",
                    "Invalid Authentication Token",
                    true
                );

            // Handle guest authentication
            if (decodedToken.isGuest) {
                isGuest = true;
                const guestId = await verifyGuestIdInJWT(decodedToken);
                if (guestId) {
                    userId = guestId;
                    newAuthToken = authToken;
                } else {
                    userId = await createGuestInRedis();
                    newAuthToken = jwt.sign(
                        { userId, isGuest: true },
                        process.env.JWT_SECRET_KEY as string,
                        { expiresIn: "168h" }
                    );
                }
            } else {
                // Handle registered user authentication
                userId = await handleRegisteredUser(decodedToken);
                isGuest = false;
                newAuthToken = authToken;
            }
        }

        // Add user to socket list
        await addUser2SocketList(userId, socket);

        // Handle joining old games
        await handleJoinOldGame(socket, userId);

        // Emit success response
        return socketEmit(socket, "registered-user", {
            authToken: newAuthToken,
            userId,
            isGuest,
        });
    } catch (err) {
        console.error(err);
        const errorMessage = (err as Error)?.message || "Server error";
        return socketEmit(socket, "register-user-error", errorMessage, true);
    }
};

export const onOngoingGame = async (socket: Socket) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "ongoing-game-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const ongoingGameId = await redisClient.get(
            `chess-app:userId:${userId}:gameId`
        );
        if (!ongoingGameId) return;

        const gameJSON = await redisClient.get(
            `chess-app:gameId:${ongoingGameId}:game`
        );
        if (!gameJSON) return;

        const game = JSON.parse(gameJSON);
        if (game.gameStatus.status !== "playing") return;

        if (ongoingGameId)
            return socketEmit(socket, "get-ongoing-game", ongoingGameId);
    } catch (err) {
        console.error(err);
        socketEmit(
            socket,
            "ongoing-game-error",
            "Failed to fetch ongoing game",
            true
        );
    }
};
