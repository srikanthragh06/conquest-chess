import { Socket } from "socket.io";
import { onOngoingGame, onRegisterUser } from "./user";
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
import { socketEmit } from "../utils/responseTemplates";
import { onCancelQueue, onQueueMatch } from "./queueMatch";
import { consoleLogRed } from "../utils/colorConsoleLogging";

const safeSocketHandler =
    (handler: (...args: any[]) => void) =>
    (...args: any[]) => {
        try {
            handler(...args);
        } catch (err) {
            consoleLogRed(`Socket error: ${String(err)}`);
        }
    };

export const handleIOConnection = (socket: Socket) => {
    socket.onAny(safeSocketHandler((event) => logSocketOn(socket, event)));

    socket.on(
        "register-user",
        safeSocketHandler(({ authToken }: { authToken: string }) =>
            onRegisterUser(authToken, socket)
        )
    );

    socket.on(
        "create-lobby",
        safeSocketHandler(() => onCreateLobby(socket))
    );

    socket.on(
        "join-lobby",
        safeSocketHandler((lobbyId: string) => onJoinLobby(socket, lobbyId))
    );

    socket.on(
        "match-select",
        safeSocketHandler(
            ({
                lobbyId,
                matchType,
            }: {
                lobbyId: string;
                matchType: "Blitz" | "Rapid" | "Bullet";
            }) => onMatchSelect(socket, lobbyId, matchType)
        )
    );

    socket.on(
        "participants-select",
        safeSocketHandler(
            ({
                lobbyId,
                newParticipants,
            }: {
                lobbyId: string;
                newParticipants: [string | null, string | null];
            }) => onParticipantsSelect(socket, lobbyId, newParticipants)
        )
    );

    socket.on(
        "leave-lobby",
        safeSocketHandler(({ lobbyId }: { lobbyId: string }) =>
            onLeaveLobby(socket, lobbyId)
        )
    );

    socket.on(
        "start-game",
        safeSocketHandler(({ lobbyId }: { lobbyId: string }) =>
            onStartGame(socket, lobbyId)
        )
    );

    socket.on(
        "get-game",
        safeSocketHandler((gameId: string) => onGetGame(socket, gameId))
    );

    socket.on(
        "make-move",
        safeSocketHandler(
            ({
                gameId,
                move,
            }: {
                gameId: string;
                move: { from: string; to: string; promotion?: string };
            }) => onMakeMove(socket, gameId, move)
        )
    );

    socket.on(
        "get-time",
        safeSocketHandler((gameId: string) => onGetTime(socket, gameId))
    );
    socket.on(
        "timeout",
        safeSocketHandler((gameId: string) => onTimeout(socket, gameId))
    );
    socket.on(
        "resign",
        safeSocketHandler((gameId: string) => onResign(socket, gameId))
    );
    socket.on(
        "request-draw",
        safeSocketHandler((gameId: string) => onRequestDraw(socket, gameId))
    );
    socket.on(
        "accept-draw",
        safeSocketHandler((gameId: string) => onAcceptDraw(socket, gameId))
    );
    socket.on(
        "reject-draw",
        safeSocketHandler((gameId: string) => onRejectDraw(socket, gameId))
    );

    socket.on(
        "queue-match",
        safeSocketHandler(
            ({ matchType }: { matchType: "Blitz" | "Rapid" | "Bullet" }) =>
                onQueueMatch(socket, matchType)
        )
    );
    socket.on(
        "cancel-queue",
        safeSocketHandler(() => onCancelQueue(socket))
    );

    socket.on(
        "ongoing-game",
        safeSocketHandler(() => onOngoingGame(socket))
    );

    socket.on(
        "ping",
        safeSocketHandler(() => {
            socketEmit(socket, "pong");
        })
    );

    socket.on(
        "disconnect",
        safeSocketHandler(() => onDisconnect(socket))
    );
};
