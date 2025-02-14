import { Socket } from "socket.io";
import { onRegisterUser } from "./user";
import { onCreateLobby, onJoinLobby } from "./lobby";
import { logSocketOn } from "../utils/logging";
import {
    onGetGame,
    onGetTime,
    onMakeMove,
    onStartGame,
    onTimeout,
} from "./game";
import { onDisconnect } from "./disconnect";

export const handleIOConnection = (socket: Socket) => {
    socket.onAny((event) => logSocketOn(socket, event));

    socket.on("register-user", ({ authToken }: { authToken: string }) =>
        onRegisterUser(authToken, socket)
    );

    socket.on("create-lobby", () => onCreateLobby(socket));
    socket.on("join-lobby", (lobbyId: string) => onJoinLobby(socket, lobbyId));

    socket.on("start-game", (lobbyId: string) => onStartGame(socket, lobbyId));
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

    socket.on("disconnect", () => onDisconnect(socket));
};
