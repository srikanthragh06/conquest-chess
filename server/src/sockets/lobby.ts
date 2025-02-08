import { Socket } from "socket.io";
import { lobbies, socket2User, user2Lobby } from "../state/state";
import { generate16CharUniqueString } from "../utils/utils";
import { io } from "../server";
import { socketEmit, socketEmitRoom } from "../utils/responseTemplates";

export const onCreateLobby = (socket: Socket) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "create-lobby-error",
            `User not registered`,
            true
        );

    const newLobbyId = generate16CharUniqueString();

    const oldLobbyId = user2Lobby.get(userId);
    if (oldLobbyId) {
        user2Lobby.delete(userId);
        const oldLobby = lobbies.get(oldLobbyId);
        if (oldLobby) {
            if (oldLobby.players.includes(userId)) {
                oldLobby.players = oldLobby.players.filter(
                    (playerId) => playerId !== userId
                );
                socket.leave(oldLobbyId);

                if (oldLobby.players.length === 0) {
                    oldLobby.emptySince = Date.now();
                } else {
                    if (oldLobby.hostId === userId) {
                        oldLobby.hostId = oldLobby.players[0];
                    }
                }
            }
        }
    }

    lobbies.set(newLobbyId, {
        lobbyId: newLobbyId,
        hostId: userId,
        players: [userId],
        emptySince: null,
    });
    user2Lobby.set(userId, newLobbyId);
    socket.join(newLobbyId);

    socketEmit(socket, "created-lobby", newLobbyId);
    io.to(newLobbyId).emit("lobby-details", lobbies.get(newLobbyId));
};

export const onJoinLobby = (socket: Socket, lobbyId: string) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "lobby-details-error",
            `User not registered`,
            true
        );

    const lobby = lobbies.get(lobbyId);
    if (!lobby)
        return socketEmit(
            socket,
            "lobby-details-error",
            `Lobby with lobby ID ${lobbyId} does not exist`,
            true
        );

    if (lobby.players.includes(userId)) {
        socketEmit(socket, "joined-lobby");
        socketEmit(socket, "lobby-details", lobby);
        return;
    }

    if (lobby.players.length === 2)
        return socketEmit(
            socket,
            "lobby-details-error",
            `Lobby already has 2 players`,
            true
        );

    lobby.players.push(userId);
    if (lobby.players.length === 1) {
        lobby.hostId = userId;
        lobby.emptySince = null;
    }
    user2Lobby.set(userId, lobbyId);
    socket.join(lobbyId);
    socketEmit(socket, "joined-lobby");
    socketEmitRoom(io, lobbyId, "lobby-details", lobby);
};
