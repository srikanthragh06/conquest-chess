import { Socket } from "socket.io";
import {
    games,
    gameType,
    lobbies,
    socket2User,
    updateGameEnd,
    updateRemainingTime,
    user2Game,
    user2Lobby,
    user2Socket,
} from "../state/state";
import { socketEmit, socketEmitRoom } from "../utils/responseTemplates";
import { generate16CharUniqueString } from "../utils/utils";
import { Chess } from "chess.js";
import { Server as SocketIOServer } from "socket.io";
import { io } from "../server";

export const onStartGame = (
    io: SocketIOServer,
    socket: Socket,
    lobbyId: string
) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "start-game-error",
            `User with socketID:${socket.id} not registered`,
            true
        );

    const lobby = lobbies.get(lobbyId);
    if (!lobby)
        return socketEmit(
            socket,
            "start-game-error",
            `Lobby with lobby ID ${lobbyId} not registered`,
            true
        );

    if (lobby.players.length !== 2)
        return socketEmit(
            socket,
            "start-game-error",
            `Lobby with lobby ID ${lobbyId} does not have 2 players`,
            true
        );

    if (lobby.hostId !== userId)
        return socketEmit(
            socket,
            "start-game-error",
            `User with socketID:${socket.id} is not the host of the lobby`,
            true
        );

    const newGameId = generate16CharUniqueString();

    const randomIndex = Math.floor(Math.random() * 2);
    const whiteId = lobby.players[randomIndex];
    const blackId = lobby.players[1 - randomIndex];
    const newGame: gameType = {
        gameId: newGameId,
        whiteId,
        blackId,
        board: new Chess(),
        moves: [],
        startTime: Date.now(),
        gameStatus: { color: "w", status: "playing" },
    };

    games.set(newGameId, newGame);
    user2Game.set(whiteId, newGameId);
    user2Game.set(blackId, newGameId);

    const whiteSocketId = user2Socket.get(whiteId);
    if (whiteSocketId) {
        const whiteSocket = io.sockets.sockets.get(whiteSocketId);
        if (whiteSocket) {
            whiteSocket.join(newGameId);
            whiteSocket.leave(lobbyId);
            user2Lobby.delete(whiteId);
        }
    }
    const blackSocketId = user2Socket.get(blackId);
    if (blackSocketId) {
        const blackSocket = io.sockets.sockets.get(blackSocketId);
        if (blackSocket) {
            blackSocket.join(newGameId);
            blackSocket.leave(lobbyId);
            user2Lobby.delete(blackId);
        }
    }
    lobbies.delete(lobbyId);

    socketEmitRoom(io, newGameId, "started-game", newGame.gameId);
};

export const onGetGame = (socket: Socket, gameId: string) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "get-game-error",
            `User with socketID ${socket.id} not registered`,
            true
        );

    const game = games.get(gameId);
    if (!game)
        return socketEmit(
            socket,
            "get-game-error",
            `Game with gameId ${gameId} not found`,
            true
        );
    socket.join(gameId);

    socketEmit(socket, "game-update", { fen: game.board.fen(), game });
};

export const onMakeMove = (
    io: SocketIOServer,
    socket: Socket,
    gameId: string,
    move: { from: string; to: string; promotion?: string }
) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "make-move-error",
            `User with socketID ${socket.id} not registered`,
            true
        );

    const game = games.get(gameId);
    if (!game)
        return socketEmit(
            socket,
            "make-move-error",
            `Game with gameId ${gameId} not found`,
            true
        );

    if (game.whiteId !== userId && game.blackId !== userId)
        return socketEmit(
            socket,
            "make-move-error",
            `User with socketID ${socket.id} is not a player in the game`,
            true
        );

    const isWhitePlayer = game.whiteId === userId;
    const isPlayerTurn =
        (game.board.turn() === "w" && isWhitePlayer) ||
        (game.board.turn() === "b" && !isWhitePlayer);

    if (!isPlayerTurn)
        return socketEmit(
            socket,
            "make-move-error",
            "It's not your turn",
            true
        );

    const result = game.board.move(move);
    if (!result)
        return socketEmit(socket, "make-move-error", "Invalid move", true);

    game.moves.push({ ...move, time: Date.now() });
    updateRemainingTime(game);
    const isGameOver = updateGameEnd(game);

    if (isGameOver) {
        socketEmitRoom(io, gameId, "game-over", {
            fen: game.board.fen(),
            game,
        });
        user2Game.delete(game.whiteId);
        user2Game.delete(game.blackId);
        games.delete(gameId);
    } else
        socketEmitRoom(io, gameId, "game-update", {
            fen: game.board.fen(),
            game,
        });
};

export const onGetTime = (socket: Socket, gameId: string) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "get-time-error",
            `User with socketID ${socket.id} not registered`,
            true
        );

    const game = games.get(gameId);
    if (!game)
        return socketEmit(
            socket,
            "get-time-error",
            `Game with gameId ${gameId} not found`,
            true
        );

    const { whiteTime, blackTime } = updateRemainingTime(game);

    socketEmit(socket, "time-update", { whiteTime, blackTime });
};

export const onTimeout = (socket: Socket, gameId: string) => {
    const userId = socket2User.get(socket.id);
    if (!userId)
        return socketEmit(
            socket,
            "timeout-error",
            `User with socketID ${socket.id} not registered`,
            true
        );

    const game = games.get(gameId);
    if (!game)
        return socketEmit(
            socket,
            "timeout-error",
            `Game with gameId ${gameId} not found`,
            true
        );

    updateRemainingTime(game);
    const isGameOver = updateGameEnd(game);

    if (isGameOver) {
        socketEmitRoom(io, gameId, "game-over", {
            fen: game.board.fen(),
            game,
        });
        user2Game.delete(game.whiteId);
        user2Game.delete(game.blackId);
        games.delete(gameId);
    }
};
