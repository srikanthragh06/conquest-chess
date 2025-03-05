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
            console.log("nojwttoken");
        } else {
            let decodedToken: JwtPayload | string | null = null;

            try {
                decodedToken = jwt.verify(
                    authToken,
                    process.env.JWT_SECRET_KEY as string
                ) as JwtPayload;
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    // Try extracting the expired token data
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
                console.log("verifyGuestId", { guestId });
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
