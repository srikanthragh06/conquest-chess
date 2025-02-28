import { Socket } from "socket.io";
import { lobbyType } from "../type/state";
import { generate16CharUniqueString } from "../utils/utils";
import { socketEmit } from "../utils/responseTemplates";
import { redisClient } from "../redis/client";

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

        const newLobbyId = generate16CharUniqueString();

        const tx = redisClient.multi();

        const oldLobbyId = await redisClient.get(
            `chess-app:userId:${userId}:lobbyId`
        );

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

                    if (oldLobby.players.length === 0) {
                        oldLobby.emptySince = Date.now();
                    } else if (oldLobby.hostId === userId) {
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
            emptySince: null,
        };

        tx.set(
            `chess-app:lobbyId:${newLobbyId}:lobby`,
            JSON.stringify(newLobby)
        );
        tx.set(`chess-app:userId:${userId}:lobbyId`, newLobbyId);

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "create-lobby-error",
                "Failed to create lobby due to a conflict. Please try again.",
                true
            );
        socket.join(newLobbyId);

        socketEmit(socket, "created-lobby", newLobbyId);

        redisClient.publish(
            `chess-app:lobby-update:${newLobbyId}`,
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

        const tx = redisClient.multi();

        const lobbyJSON = await redisClient.get(
            `chess-app:lobbyId:${lobbyId}:lobby`
        );
        if (!lobbyJSON)
            return socketEmit(
                socket,
                "lobby-details-error",
                `Lobby with ID ${lobbyId} does not exist`,
                true
            );

        const lobby: lobbyType = JSON.parse(lobbyJSON);
        if (lobby.players.includes(userId)) {
            socketEmit(socket, "joined-lobby");
            socketEmit(socket, "lobby-details", lobby);
            return;
        }

        if (lobby.players.length >= 2)
            return socketEmit(
                socket,
                "lobby-details-error",
                "Lobby already has 2 players",
                true
            );

        lobby.players.push(userId);
        if (lobby.players.length === 1) {
            lobby.hostId = userId;
            lobby.emptySince = null;
        }

        tx.set(`chess-app:lobbyId:${lobbyId}:lobby`, JSON.stringify(lobby));
        tx.set(`chess-app:userId:${userId}:lobbyId`, lobbyId);

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "join-lobby-error",
                "Failed to join lobby due to conflict",
                true
            );
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
    matchType: "BLitz" | "Rapid" | "Bullet"
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

        const lobbyJSON = await redisClient.get(
            `chess-app:lobbyId:${lobbyId}:lobby`
        );
        if (!lobbyJSON)
            return socketEmit(
                socket,
                "match-select-error",
                `Lobby with ID ${lobbyId} does not exist`,
                true
            );
        redisClient.publish(`chess-app:match-select:${lobbyId}`, matchType);
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
