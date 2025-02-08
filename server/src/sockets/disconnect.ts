import { Socket } from "socket.io";
import { io } from "../server";
import { socketEmitRoom } from "../utils/responseTemplates";
import { lobbies, socket2User, user2Socket } from "../state/state";

const removeUserFromSocketMappings = (socketId: string) => {
    const userId = socket2User.get(socketId);
    if (userId) {
        socket2User.delete(socketId);
        user2Socket.delete(userId);
    }
    return userId;
};

const handleUserLeavingLobby = (
    userId: string,
    lobbyId: string,
    socket: Socket
) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    if (lobby.players.includes(userId)) {
        lobby.players = lobby.players.filter((playerId) => playerId !== userId);
        socket.leave(lobbyId);

        if (lobby.players.length === 0) {
            lobby.emptySince = Date.now();
        } else if (lobby.hostId === userId) {
            lobby.hostId = lobby.players[0];
        }

        socketEmitRoom(io, lobbyId, "lobby-details", lobby);
    }
};

export const onDisconnect = (socket: Socket) => {
    const userId = removeUserFromSocketMappings(socket.id);
    if (!userId) return;

    const userLobbyId = user2Socket.get(userId);
    if (userLobbyId) {
        handleUserLeavingLobby(userId, userLobbyId, socket);
    }
};
