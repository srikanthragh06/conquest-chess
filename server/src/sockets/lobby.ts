import { Socket } from "socket.io";
import { lobbyType } from "../type/state";
import { generate16CharUniqueString } from "../utils/utils";
import { socketEmit } from "../utils/responseTemplates";
import { executeWithRetry, redisClient } from "../redis/client";
import { handleLeaveLobby } from "../helpers/lobby";

export const onCreateLobby = async (socket: Socket) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "create-lobby-error",
                "User not registered",
                true
            );

        const oldLobbyId = await redisClient.get(
            `chess-app:userId:${userId}:lobbyId`
        );
        const result = await executeWithRetry(
            redisClient,
            [`chess-app:lobbyId:${oldLobbyId}:lobby`],
            async (tx) => {
                const newLobbyId = generate16CharUniqueString();

                if (oldLobbyId) {
                    tx.del(`chess-app:userId:${userId}:lobbyId`);

                    const oldLobbyJSON = await redisClient.get(
                        `chess-app:lobbyId:${oldLobbyId}:lobby`
                    );
                    if (oldLobbyJSON) {
                        const oldLobby: lobbyType = JSON.parse(oldLobbyJSON);

                        if (oldLobby.players.includes(userId)) {
                            oldLobby.players = oldLobby.players.filter(
                                (playerId: string) => playerId !== userId
                            );
                            socket.leave(oldLobbyId);

                            if (oldLobby.hostId === userId) {
                                oldLobby.hostId = oldLobby.players[0];
                            }

                            tx.set(
                                `chess-app:lobbyId:${oldLobbyId}:lobby`,
                                JSON.stringify(oldLobby)
                            );
                        }
                    }
                }
                const newLobby: lobbyType = {
                    lobbyId: newLobbyId,
                    hostId: userId,
                    players: [userId],
                    matchType: "Blitz",
                    participants: [null, null],
                };
                tx.set(
                    `chess-app:lobbyId:${newLobbyId}:lobby`,
                    JSON.stringify(newLobby)
                );
                tx.set(`chess-app:userId:${userId}:lobbyId`, newLobbyId);

                return { newLobby };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "create-lobby-error",
                "Failed due to conflict",
                true
            );

        const { newLobby } = result;

        socket.join(newLobby.lobbyId);

        socketEmit(socket, "created-lobby", newLobby.lobbyId);

        redisClient.publish(
            `chess-app:lobby-update:${newLobby.lobbyId}`,
            JSON.stringify(newLobby)
        );
    } catch (err) {
        socketEmit(
            socket,
            "create-lobby-error",
            "Failed to create lobby",
            true
        );
        console.error("Error during lobby creation:", err);
    }
};

export const onJoinLobby = async (socket: Socket, lobbyId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "lobby-details-error",
                "User not registered",
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:lobbyId:${lobbyId}:lobby`],
            async (tx) => {
                const lobbyJSON = await redisClient.get(
                    `chess-app:lobbyId:${lobbyId}:lobby`
                );
                if (!lobbyJSON) {
                    socketEmit(
                        socket,
                        "lobby-details-error",
                        `Lobby with ID ${lobbyId} does not exist`,
                        true
                    );
                    return null;
                }

                const lobby: lobbyType = JSON.parse(lobbyJSON);

                if (lobby.players.includes(userId)) {
                    socketEmit(socket, "joined-lobby");
                    socketEmit(socket, "lobby-details", lobby);
                    return { lobby };
                }

                if (lobby.players.length >= 10) {
                    socketEmit(
                        socket,
                        "lobby-details-error",
                        "This lobby already has its max of 10 players",
                        true
                    );
                    return null;
                }

                lobby.players.push(userId);
                if (lobby.players.length === 1) {
                    lobby.hostId = userId;
                }

                tx.set(
                    `chess-app:lobbyId:${lobbyId}:lobby`,
                    JSON.stringify(lobby)
                );
                tx.set(`chess-app:userId:${userId}:lobbyId`, lobbyId);

                return { lobby };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "join-lobby-error",
                "Failed to join lobby due to conflict",
                true
            );

        const { lobby } = result;

        socket.join(lobbyId);
        socketEmit(socket, "joined-lobby");

        redisClient.publish(
            `chess-app:lobby-update:${lobbyId}`,
            JSON.stringify(lobby)
        );
    } catch (err) {
        socketEmit(socket, "join-lobby-error", "Failed to join lobby", true);
        console.error("Error during joining lobby:", err);
    }
};

export const onMatchSelect = async (
    socket: Socket,
    lobbyId: string,
    matchType: "Blitz" | "Rapid" | "Bullet"
) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "match-select-error",
                "User not registered",
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:lobbyId:${lobbyId}:lobby`],
            async (tx) => {
                const lobbyJSON = await redisClient.get(
                    `chess-app:lobbyId:${lobbyId}:lobby`
                );
                if (!lobbyJSON) {
                    socketEmit(
                        socket,
                        "match-select-error",
                        `Lobby with ID ${lobbyId} does not exist`,
                        true
                    );
                    return null;
                }

                const lobby = JSON.parse(lobbyJSON);
                lobby.matchType = matchType;

                tx.set(
                    `chess-app:lobbyId:${lobbyId}:lobby`,
                    JSON.stringify(lobby)
                );

                return { lobby };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "match-select-error",
                "Failed due to conflict"
            );

        const { lobby } = result;

        redisClient.publish(
            `chess-app:lobby-update:${lobbyId}`,
            JSON.stringify(lobby)
        );
    } catch (err) {
        socketEmit(
            socket,
            "match-select-error",
            "Failed to emit match type select",
            true
        );
        console.error("Error during match-select:", err);
    }
};

export const onParticipantsSelect = async (
    socket: Socket,
    lobbyId: string,
    newParticipants: [string | null, string | null]
) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "participants-select-error",
                "User not registered",
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:lobbyId:${lobbyId}:lobby`],
            async (tx) => {
                const lobbyJSON = await redisClient.get(
                    `chess-app:lobbyId:${lobbyId}:lobby`
                );
                if (!lobbyJSON) {
                    socketEmit(
                        socket,
                        "participants-select-error",
                        `Lobby with ID ${lobbyId} does not exist`,
                        true
                    );
                    return null;
                }

                const lobby = JSON.parse(lobbyJSON);
                if (
                    newParticipants[0] &&
                    !lobby.players.includes(newParticipants[0])
                ) {
                    socketEmit(
                        socket,
                        "participants-select-error",
                        `${newParticipants[0]} does not belong to this lobby`,
                        true
                    );
                    return null;
                }

                if (
                    newParticipants[1] &&
                    !lobby.players.includes(newParticipants[1])
                ) {
                    socketEmit(
                        socket,
                        "participants-select-error",
                        `${newParticipants[1]} does not belong to this lobby`,
                        true
                    );
                    return null;
                }

                lobby.participants = newParticipants;

                tx.set(
                    `chess-app:lobbyId:${lobbyId}:lobby`,
                    JSON.stringify(lobby)
                );

                return { lobby };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "participants-select-error",
                "Failed due to conflict"
            );

        const { lobby } = result;

        redisClient.publish(
            `chess-app:lobby-update:${lobbyId}`,
            JSON.stringify(lobby)
        );
    } catch (err) {
        socketEmit(
            socket,
            "participants-select-error",
            "Failed to emit match type select",
            true
        );
        console.error("Error during participants selection:", err);
    }
};

export const onLeaveLobby = async (
    socket: Socket,
    lobbyId: string
): Promise<void> => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "leave-lobby-error",
                "User not registered",
                true
            );

        await handleLeaveLobby(socket, userId, lobbyId, "leave-lobby-error");
    } catch (err) {
        socketEmit(
            socket,
            "leave-lobby-error",
            "Error while leaving lobby",
            true
        );
        console.error("Error during leaving lobby:", err);
    }
};
