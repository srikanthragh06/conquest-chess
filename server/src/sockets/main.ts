import { Socket } from "socket.io";
import { onRegisterUser } from "./user";
import {
    onCreateLobby,
    onJoinLobby,
    onLeaveLobby,
    onMatchSelect,
    onParticipantsSelect,
} from "./lobby";
import { logSocketOn } from "../utils/logging";
import {
    onAcceptDraw,
    onGetGame,
    onGetTime,
    onMakeMove,
    onRejectDraw,
    onRequestDraw,
    onResign,
    onStartGame,
    onTimeout,
} from "./game";
import { onDisconnect } from "./disconnect";
import { stringify } from "querystring";

export const handleIOConnection = (socket: Socket) => {
    socket.onAny((event) => logSocketOn(socket, event));

    socket.on("register-user", ({ authToken }: { authToken: string }) =>
        onRegisterUser(authToken, socket)
    );

    socket.on("create-lobby", () => onCreateLobby(socket));
    socket.on("join-lobby", (lobbyId: string) => onJoinLobby(socket, lobbyId));
    socket.on(
        "match-select",
        ({
            lobbyId,
            matchType,
        }: {
            lobbyId: string;
            matchType: "BLitz" | "Rapid" | "Bullet";
        }) => onMatchSelect(socket, lobbyId, matchType)
    );
    socket.on(
        "participants-select",
        ({
            lobbyId,
            newParticipants,
        }: {
            lobbyId: string;
            newParticipants: [string | null, string | null];
        }) => onParticipantsSelect(socket, lobbyId, newParticipants)
    );
    socket.on("leave-lobby", ({ lobbyId }: { lobbyId: string }) =>
        onLeaveLobby(socket, lobbyId)
    );

    socket.on("start-game", ({ lobbyId }: { lobbyId: string }) =>
        onStartGame(socket, lobbyId)
    );
    socket.on("get-game", (gameId: string) => onGetGame(socket, gameId));
    socket.on(
        "make-move",
        ({
            gameId,
            move,
        }: {
            gameId: string;
            move: { from: string; to: string; promotion?: string };
        }) => onMakeMove(socket, gameId, move)
    );
    socket.on("get-time", (gameId: string) => onGetTime(socket, gameId));
    socket.on("timeout", (gameId: string) => onTimeout(socket, gameId));
    socket.on("resign", (gameId: string) => onResign(socket, gameId));
    socket.on("request-draw", (gameId: string) =>
        onRequestDraw(socket, gameId)
    );
    socket.on("accept-draw", (gameId: string) => onAcceptDraw(socket, gameId));
    socket.on("reject-draw", (gameId: string) => onRejectDraw(socket, gameId));

    socket.on("disconnect", () => onDisconnect(socket));
};
