import { Socket } from "socket.io";
import { gameType, lobbyType, movesType } from "../type/state";
import { socketEmit } from "../utils/responseTemplates";
import { Chess } from "chess.js";
import { executeWithRetry, redisClient } from "../redis/client";
import {
    getGameInDB,
    getMovesInDB,
    saveGameInDB,
    startGame,
    updateGameEnd,
    updateRemainingTime,
} from "../helpers/game";

export const onStartGame = async (socket: Socket, lobbyId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "start-game-error",
                `User with socketID:${socket.id} not registered`,
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
                        "start-game-error",
                        `Lobby with ID ${lobbyId} does not exist`,
                        true
                    );
                    return null;
                }

                const lobby: lobbyType = JSON.parse(lobbyJSON);
                if (!lobby.participants[0] || !lobby.participants[1]) {
                    socketEmit(
                        socket,
                        "start-game-error",
                        `Lobby with lobby ID ${lobbyId} does not have both participants selected`,
                        true
                    );
                    return null;
                }

                if (lobby.hostId !== userId) {
                    socketEmit(
                        socket,
                        "start-game-error",
                        `User with socketID:${socket.id} is not the host of the lobby`,
                        true
                    );
                    return null;
                }

                const newGame = await startGame(
                    tx,
                    lobby.matchType,
                    lobby.participants
                );

                lobby.participants = [null, null];
                tx.set(
                    `chess-app:lobbyId:${lobby.lobbyId}:lobby`,
                    JSON.stringify(lobby)
                );

                const whiteSocketId = await redisClient.get(
                    `chess-app:userId:${newGame.whiteId}:socketId`
                );

                const blackSocketId = await redisClient.get(
                    `chess-app:userId:${newGame.blackId}:socketId`
                );

                return { newGame, whiteSocketId, blackSocketId };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "start-game-error",
                "Failed to start game due to conflict",
                true
            );

        const { newGame, whiteSocketId, blackSocketId } = result;

        redisClient.publish(
            `chess-app:started-game:${newGame.gameId}`,
            JSON.stringify({
                gameId: newGame.gameId,
                lobbyId,
                whiteSocketId,
                blackSocketId,
            })
        );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "start-game-error", "Failed to start game", true);
    }
};

export const onGetGame = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "get-game-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(
            `chess-app:gameId:${gameId}:game`
        );
        if (!gameJSON) {
            const game = await getGameInDB(gameId);
            const moves = await getMovesInDB(gameId);

            if (!game || !moves)
                return socketEmit(
                    socket,
                    "get-game-error",
                    `Game with gameId ${gameId} not found`,
                    true
                );

            return socketEmit(socket, "get-full-game", {
                game,
                moves,
            });
        }

        const game: gameType = JSON.parse(gameJSON);

        const movesRaw = await redisClient.lrange(
            `chess-app:gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        if (game.gameStatus.status !== "playing")
            return socketEmit(socket, "get-full-game", { game, moves });

        socket.join(gameId);

        socketEmit(socket, "game-update", {
            game,
            moves,
        });
    } catch (err) {
        console.error(err);
        socketEmit(socket, "game-game-error", "Failed to get game", true);
    }
};

export const onMakeMove = async (
    socket: Socket,
    gameId: string,
    move: { from: string; to: string; promotion?: string }
) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "make-move-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [
                `chess-app:gameId:${gameId}:game`,
                `chess-app:gameId:${gameId}:moves`,
            ],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "make-move-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }

                const game: gameType = JSON.parse(gameJSON);
                const board = new Chess(game.fen);

                const movesRaw = await redisClient.lrange(
                    `chess-app:gameId:${gameId}:moves`,
                    0,
                    -1
                );
                const moves: movesType = movesRaw.map((move) =>
                    JSON.parse(move)
                );

                if (game.whiteId !== userId && game.blackId !== userId) {
                    socketEmit(
                        socket,
                        "make-move-error",
                        `User with socketID ${socket.id} is not a player in the game`,
                        true
                    );
                    return null;
                }
                const isWhitePlayer = game.whiteId === userId;
                const isPlayerTurn =
                    (board.turn() === "w" && isWhitePlayer) ||
                    (board.turn() === "b" && !isWhitePlayer);

                if (!isPlayerTurn) {
                    socketEmit(
                        socket,
                        "make-move-error",
                        "It's not your turn",
                        true
                    );
                    return null;
                }

                const moveResult = board.move(move);
                if (!moveResult) {
                    socketEmit(socket, "make-move-error", "Invalid move", true);
                    return null;
                }

                game.fen = board.fen();

                tx.rpush(
                    `chess-app:gameId:${gameId}:moves`,
                    JSON.stringify({ ...move, time: Date.now() })
                );

                moves.push({ ...move, time: Date.now() });
                updateRemainingTime(game, moves);
                const isGameOver = updateGameEnd(game, moves);

                tx.set(`chess-app:gameId:${gameId}:game`, JSON.stringify(game));
                if (isGameOver) {
                    tx.expire(
                        `chess-app:userId:${game.whiteId}:gameId`,
                        1 * 60
                    );
                    tx.expire(
                        `chess-app:userId:${game.blackId}:gameId`,
                        1 * 60
                    );
                    tx.expire(`chess-app:gameId:${gameId}:game`, 1 * 60);
                    tx.expire(`chess-app:gameId:${gameId}:moves`, 1 * 60);
                }

                return { game, moves, isGameOver };
            }
        );

        if (!result)
            return socketEmit(
                socket,
                "make-move-error",
                "Failed to make move due to conflict",
                true
            );

        const { isGameOver, game, moves } = result;

        if (isGameOver) {
            redisClient.publish(
                `chess-app:game-over:${gameId}`,
                JSON.stringify({ game, moves })
            );
            await saveGameInDB(game, moves);
        } else
            return redisClient.publish(
                `chess-app:game-update:${gameId}`,
                JSON.stringify({ game, moves })
            );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "make-move-error", "Failed to make move", true);
    }
};

export const onGetTime = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "get-time-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(
            `chess-app:gameId:${gameId}:game`
        );
        if (!gameJSON)
            return socketEmit(
                socket,
                "get-time-error",
                `Game with gameId ${gameId} not found`,
                true
            );
        const game: gameType = JSON.parse(gameJSON);
        if (game.gameStatus.status !== "playing")
            return socketEmit(
                socket,
                "get-time-error",
                "Game is already completed",
                true
            );

        const movesRaw = await redisClient.lrange(
            `chess-app:gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        const { whiteTime, blackTime } = updateRemainingTime(game, moves);

        socketEmit(socket, "time-update", { whiteTime, blackTime });
    } catch (err) {
        console.error(err);
        socketEmit(socket, "get-time-error", "Failed to get time", true);
    }
};

export const onTimeout = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "timeout-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [
                `chess-app:gameId:${gameId}:game`,
                `chess-app:gameId:${gameId}:moves`,
            ],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "timeout-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }

                const game: gameType = JSON.parse(gameJSON);

                const movesRaw = await redisClient.lrange(
                    `chess-app:gameId:${gameId}:moves`,
                    0,
                    -1
                );
                const moves: movesType = movesRaw.map((move) =>
                    JSON.parse(move)
                );

                updateRemainingTime(game, moves);
                const isGameOver = updateGameEnd(game, moves);

                if (isGameOver) {
                    tx.set(
                        `chess-app:gameId:${gameId}:game`,
                        JSON.stringify(game)
                    );

                    tx.expire(
                        `chess-app:userId:${game.whiteId}:gameId`,
                        1 * 60 * 60
                    );
                    tx.expire(
                        `chess-app:userId:${game.blackId}:gameId`,
                        1 * 60 * 60
                    );
                    tx.expire(`chess-app:gameId:${gameId}:game`, 1 * 60 * 60);
                    tx.expire(`chess-app:gameId:${gameId}:moves`, 1 * 60 * 60);

                    return { isGameOver, game, moves };
                }
                return null;
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "timeout-error",
                "Failed due to conflict",
                true
            );

        const { isGameOver, game, moves } = result;

        if (isGameOver) {
            redisClient.publish(
                `chess-app:game-over:${gameId}`,
                JSON.stringify({ game, moves })
            );
            await saveGameInDB(game, moves);
        }
    } catch (err) {
        console.error(err);
        socketEmit(socket, "timeout-error", "Failed to time out game", true);
    }
};

export const onResign = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "resign-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [
                `chess-app:gameId:${gameId}:game`,
                `chess-app:gameId:${gameId}:moves`,
            ],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "resign-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }
                const game: gameType = JSON.parse(gameJSON);
                if (game.gameStatus.status !== "playing") {
                    socketEmit(
                        socket,
                        "resign-error",
                        "Game has already ended",
                        true
                    );
                    return null;
                }

                const movesRaw = await redisClient.lrange(
                    `chess-app:gameId:${gameId}:moves`,
                    0,
                    -1
                );
                const moves: movesType = movesRaw.map((move) =>
                    JSON.parse(move)
                );

                const isPlayer =
                    game.whiteId === userId || game.blackId === userId;
                if (!isPlayer) {
                    socketEmit(
                        socket,
                        "resign-error",
                        "Only a player of the game can resign",
                        true
                    );
                    return null;
                }

                if (game.whiteId === userId) {
                    game.gameStatus.color = "b";
                    game.gameStatus.status = "resignation";
                } else {
                    game.gameStatus.color = "w";
                    game.gameStatus.status = "resignation";
                }

                tx.set(`chess-app:gameId:${gameId}:game`, JSON.stringify(game));

                tx.expire(
                    `chess-app:userId:${game.whiteId}:gameId`,
                    1 * 60 * 60
                );
                tx.expire(
                    `chess-app:userId:${game.blackId}:gameId`,
                    1 * 60 * 60
                );
                tx.expire(`chess-app:gameId:${gameId}:game`, 1 * 60 * 60);
                tx.expire(`chess-app:gameId:${gameId}:moves`, 1 * 60 * 60);

                return { game, moves };
            }
        );

        if (result === null)
            return socketEmit(socket, "resign-error", "Failed due to conflict");

        const { game, moves } = result;

        redisClient.publish(
            `chess-app:game-over:${gameId}`,
            JSON.stringify({ game, moves })
        );
        await saveGameInDB(game, moves);
    } catch (err) {
        socketEmit(socket, "resign-error", "Failed to resign game", true);
        console.error(err);
    }
};

export const onRequestDraw = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "request-draw-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:gameId:${gameId}:game`],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "request-draw-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }

                const game: gameType = JSON.parse(gameJSON);
                if (game.gameStatus.status !== "playing") {
                    socketEmit(
                        socket,
                        "request-draw-error",
                        "Game has already ended",
                        true
                    );
                    return null;
                }
                const isPlayer =
                    game.whiteId === userId || game.blackId === userId;
                if (!isPlayer) {
                    socketEmit(
                        socket,
                        "request-draw-error",
                        "Only a player of the game can request draw",
                        true
                    );
                    return null;
                }

                if (
                    (game.whiteId === userId && game.drawRejects.w >= 3) ||
                    (game.blackId === userId && game.drawRejects.b >= 3)
                ) {
                    socketEmit(
                        socket,
                        "request-draw-error",
                        "Too many draw requests",
                        true
                    );
                    return null;
                }
                if (game.whiteId === userId) game.drawRequested.w = true;
                if (game.blackId === userId) game.drawRequested.b = true;

                tx.set(`chess-app:gameId:${gameId}:game`, JSON.stringify(game));

                return { game };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "request-draw-error",
                "Failed due to conflict"
            );

        const { game } = result;

        if (game.whiteId === userId)
            return redisClient.publish(
                `chess-app:request-draw:${gameId}`,
                game.blackId
            );
        else
            return redisClient.publish(
                `chess-app:request-draw:${gameId}`,
                game.whiteId
            );
    } catch (err) {
        socketEmit(
            socket,
            "request-draw-error",
            "Failed to request draw",
            true
        );
        console.error(err);
    }
};

export const onAcceptDraw = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "accept-draw-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [
                `chess-app:gameId:${gameId}:game`,
                `chess-app:gameId:${gameId}:moves`,
            ],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "accept-draw-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }

                const game: gameType = JSON.parse(gameJSON);
                if (game.gameStatus.status !== "playing") {
                    socketEmit(
                        socket,
                        "accept-draw-error",
                        "Game has already ended",
                        true
                    );
                    return null;
                }

                const movesRaw = await redisClient.lrange(
                    `chess-app:gameId:${gameId}:moves`,
                    0,
                    -1
                );
                const moves: movesType = movesRaw.map((move) =>
                    JSON.parse(move)
                );

                const isPlayer =
                    game.whiteId === userId || game.blackId === userId;
                if (!isPlayer) {
                    socketEmit(
                        socket,
                        "accept-draw-error",
                        "Only a player of the game can resign",
                        true
                    );
                    return null;
                }

                if (
                    !(
                        (game.whiteId === userId &&
                            game.drawRequested.b === true) ||
                        (game.blackId === userId &&
                            game.drawRequested.w === true)
                    )
                ) {
                    socketEmit(
                        socket,
                        "accept-draw-error",
                        "No draw request made",
                        true
                    );
                    return null;
                }

                game.gameStatus.status = "mutual-draw";

                tx.set(`chess-app:gameId:${gameId}:game`, JSON.stringify(game));

                tx.expire(
                    `chess-app:userId:${game.whiteId}:gameId`,
                    1 * 60 * 60
                );
                tx.expire(
                    `chess-app:userId:${game.blackId}:gameId`,
                    1 * 60 * 60
                );
                tx.expire(`chess-app:gameId:${gameId}:game`, 1 * 60 * 60);
                tx.expire(`chess-app:gameId:${gameId}:moves`, 1 * 60 * 60);

                return { game, moves };
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "accept-draw-error",
                "Failed due to conflict",
                true
            );

        const { game, moves } = result;

        redisClient.publish(
            `chess-app:game-over:${gameId}`,
            JSON.stringify({ game, moves })
        );
        await saveGameInDB(game, moves);
    } catch (err) {
        socketEmit(socket, "accept-draw-error", "Failed to accept draw", true);
        console.error(err);
    }
};

export const onRejectDraw = async (socket: Socket, gameId: string) => {
    try {
        const userId = await redisClient.get(
            `chess-app:socketId:${socket.id}:userId`
        );
        if (!userId)
            return socketEmit(
                socket,
                "reject-draw-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const result = await executeWithRetry(
            redisClient,
            [`chess-app:gameId:${gameId}:game`],
            async (tx) => {
                const gameJSON = await redisClient.get(
                    `chess-app:gameId:${gameId}:game`
                );
                if (!gameJSON) {
                    socketEmit(
                        socket,
                        "reject-draw-error",
                        `Game with gameId ${gameId} not found`,
                        true
                    );
                    return null;
                }

                const game: gameType = JSON.parse(gameJSON);
                if (game.gameStatus.status !== "playing") {
                    socketEmit(
                        socket,
                        "reject-draw-error",
                        "Game has already ended",
                        true
                    );
                    return null;
                }

                const isPlayer =
                    game.whiteId === userId || game.blackId === userId;
                if (!isPlayer) {
                    socketEmit(
                        socket,
                        "reject-draw-error",
                        "Only a player of the game can resign",
                        true
                    );
                    return null;
                }

                if (
                    !(
                        (game.whiteId === userId &&
                            game.drawRequested.b === true) ||
                        (game.blackId === userId &&
                            game.drawRequested.w === true)
                    )
                ) {
                    socketEmit(
                        socket,
                        "reject-draw-error",
                        "No draw request made",
                        true
                    );
                    return null;
                }

                if (game.whiteId === userId && game.drawRequested.b) {
                    game.drawRejects.b += 1;
                    game.drawRequested.b = false;
                } else if (game.blackId === userId && game.drawRequested.w) {
                    game.drawRejects.w += 1;
                    game.drawRequested.w = false;
                }

                tx.set(`chess-app:gameId:${gameId}:game`, JSON.stringify(game));

                return {};
            }
        );

        if (result === null)
            return socketEmit(
                socket,
                "reject-draw-error",
                "Failed due to conflict",
                true
            );
    } catch (err) {
        socketEmit(socket, "reject-draw-error", "Failed to reject draw", true);
        console.error(err);
    }
};
