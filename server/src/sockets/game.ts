import { Socket } from "socket.io";
import {
    gameType,
    lobbyType,
    movesType,
    updateGameEnd,
    updateRemainingTime,
} from "../state/state";
import { socketEmit, socketEmitRoom } from "../utils/responseTemplates";
import { generate16CharUniqueString } from "../utils/utils";
import { Chess } from "chess.js";
import { redisClient } from "../redis/client";

export const onStartGame = async (socket: Socket, lobbyId: string) => {
    try {
        await redisClient.watch(
            `socketId:${socket.id}:userId`,
            `lobbyId:${lobbyId}:lobby`
        );

        const userId = await redisClient.get(`socketId:${socket.id}:userId`);
        if (!userId)
            return socketEmit(
                socket,
                "start-game-error",
                `User with socketID:${socket.id} not registered`,
                true
            );

        const lobbyJSON = await redisClient.get(`lobbyId:${lobbyId}:lobby`);
        if (!lobbyJSON)
            return socketEmit(
                socket,
                "start-game-error",
                `Lobby with ID ${lobbyId} does not exist`,
                true
            );

        const lobby: lobbyType = JSON.parse(lobbyJSON);

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
            fen: new Chess().fen(),
            startTime: Date.now(),
            gameStatus: { color: "w", status: "playing" },
        };

        await redisClient.watch(
            `gameId:${newGameId}:game`,
            `gameId:${newGameId}:moves`,

            `userId:${whiteId}:gameId`,
            `userId:${blackId}:gameId`,

            `userId:${whiteId}:socketId`,
            `userId:${blackId}:socketId`,

            `userId:${whiteId}:lobbyId`,
            `userId:${blackId}:lobbyId`
        );

        const tx = redisClient.multi();
        tx.set(`gameId:${newGameId}:game`, JSON.stringify(newGame));

        tx.set(`userId:${whiteId}:gameId`, newGameId);
        tx.set(`userId:${blackId}:gameId`, newGameId);

        tx.del(`userId:${whiteId}:lobbyId`);
        tx.del(`userId:${blackId}:lobbyId`);

        tx.del(`lobbyId:${lobbyId}:lobby`);

        const whiteSocketId = await redisClient.get(
            `userId:${whiteId}:socketId`
        );

        const blackSocketId = await redisClient.get(
            `userId:${blackId}:socketId`
        );

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "start-game-error",
                "Failed to start game due to conflict",
                true
            );

        redisClient.publish(
            `started-game:${newGameId}`,
            JSON.stringify({
                gameId: newGameId,
                lobbyId,
                whiteSocketId,
                blackSocketId,
            })
        );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "start-game-error", "Failed to start game", true);
    } finally {
        await redisClient.unwatch();
    }
};

export const onGetGame = async (socket: Socket, gameId: string) => {
    try {
        await redisClient.watch(
            `socketId:${socket.id}:userId`,
            `gameId:${gameId}:game`,
            `gameId:${gameId}:moves`
        );
        const userId = await redisClient.get(`socketId:${socket.id}:userId`);
        if (!userId)
            return socketEmit(
                socket,
                "get-game-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(`gameId:${gameId}:game`);
        if (!gameJSON)
            return socketEmit(
                socket,
                "get-game-error",
                `Game with gameId ${gameId} not found`,
                true
            );

        const game = JSON.parse(gameJSON);

        const movesRaw = await redisClient.lrange(
            `gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        socket.join(gameId);

        socketEmit(socket, "game-update", {
            game,
            moves,
        });
    } catch (err) {
        console.error(err);
        socketEmit(socket, "game-game-error", "Failed to get game", true);
    } finally {
        await redisClient.unwatch();
    }
};

export const onMakeMove = async (
    socket: Socket,
    gameId: string,
    move: { from: string; to: string; promotion?: string }
) => {
    try {
        await redisClient.watch(
            `socketId:${socket.id}:userId`,
            `gameId:${gameId}:game`,
            `gameId:${gameId}:moves`
        );

        const userId = await redisClient.get(`socketId:${socket.id}:userId`);
        if (!userId)
            return socketEmit(
                socket,
                "make-move-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(`gameId:${gameId}:game`);
        if (!gameJSON)
            return socketEmit(
                socket,
                "make-move-error",
                `Game with gameId ${gameId} not found`,
                true
            );

        const game: gameType = JSON.parse(gameJSON);
        const board = new Chess(game.fen);

        const movesRaw = await redisClient.lrange(
            `gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        if (game.whiteId !== userId && game.blackId !== userId)
            return socketEmit(
                socket,
                "make-move-error",
                `User with socketID ${socket.id} is not a player in the game`,
                true
            );

        const isWhitePlayer = game.whiteId === userId;
        const isPlayerTurn =
            (board.turn() === "w" && isWhitePlayer) ||
            (board.turn() === "b" && !isWhitePlayer);

        if (!isPlayerTurn)
            return socketEmit(
                socket,
                "make-move-error",
                "It's not your turn",
                true
            );

        const moveResult = board.move(move);
        if (!moveResult)
            return socketEmit(socket, "make-move-error", "Invalid move", true);

        game.fen = board.fen();

        const tx = redisClient.multi();
        tx.rpush(
            `gameId:${gameId}:moves`,
            JSON.stringify({ ...move, time: Date.now() })
        );
        moves.push({ ...move, time: Date.now() });

        updateRemainingTime(game, moves);
        const isGameOver = updateGameEnd(game, moves);

        if (isGameOver) {
            await redisClient.watch(
                `userId:${game.whiteId}:gameId`,
                `userId:${game.blackId}:gameId`
            );
            tx.del(`userId:${game.whiteId}:gameId`);
            tx.del(`userId:${game.blackId}:gameId`);
            tx.del(`gameId:${gameId}:game`);
            tx.del(`gameId:${gameId}:moves`);
        } else {
            tx.set(`gameId:${gameId}:game`, JSON.stringify(game));
        }

        const result = await tx.exec();
        if (!result)
            return socketEmit(
                socket,
                "make-move-error",
                "Failed to make move due to conflict",
                true
            );

        if (isGameOver)
            return redisClient.publish(
                `game-over:${gameId}`,
                JSON.stringify({ game, moves })
            );
        else
            return redisClient.publish(
                `game-update:${gameId}`,
                JSON.stringify({ game, moves })
            );
    } catch (err) {
        console.error(err);
        socketEmit(socket, "make-move-error", "Failed to make move", true);
    } finally {
        await redisClient.unwatch();
    }
};

export const onGetTime = async (socket: Socket, gameId: string) => {
    try {
        await redisClient.watch(
            `socketId:${socket.id}:userId`,
            `gameId:${gameId}:game`
        );
        const userId = await redisClient.get(`socketId:${socket.id}:userId`);
        if (!userId)
            return socketEmit(
                socket,
                "get-time-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(`gameId:${gameId}:game`);
        if (!gameJSON)
            return socketEmit(
                socket,
                "get-time-error",
                `Game with gameId ${gameId} not found`,
                true
            );
        const game = JSON.parse(gameJSON);

        const movesRaw = await redisClient.lrange(
            `gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        const { whiteTime, blackTime } = updateRemainingTime(game, moves);

        socketEmit(socket, "time-update", { whiteTime, blackTime });
    } catch (err) {
        console.error(err);
        socketEmit(socket, "get-time-error", "Failed to get time", true);
    } finally {
        await redisClient.unwatch();
    }
};

export const onTimeout = async (socket: Socket, gameId: string) => {
    try {
        await redisClient.watch(
            `socketId:${socket.id}:userId`,
            `gameId:${gameId}:game`,
            `gameId:${gameId}:moves`
        );
        const userId = await redisClient.get(`socketId:${socket.id}:userId`);
        if (!userId)
            return socketEmit(
                socket,
                "timeout-error",
                `User with socketID ${socket.id} not registered`,
                true
            );

        const gameJSON = await redisClient.get(`gameId:${gameId}:game`);
        if (!gameJSON)
            return socketEmit(
                socket,
                "timeout-error",
                `Game with gameId ${gameId} not found`,
                true
            );

        const game = JSON.parse(gameJSON);

        const movesRaw = await redisClient.lrange(
            `gameId:${gameId}:moves`,
            0,
            -1
        );
        const moves: movesType = movesRaw.map((move) => JSON.parse(move));

        updateRemainingTime(game, moves);
        const isGameOver = updateGameEnd(game, moves);

        if (isGameOver) {
            await redisClient.watch(`userId:${game.whiteId}:gameId`);
            await redisClient.watch(`userId:${game.blackId}:gameId`);

            const tx = redisClient.multi();
            tx.del(`userId:${game.whiteId}:gameId`);
            tx.del(`userId:${game.blackId}:gameId`);
            tx.del(`gameId:${gameId}:game`);
            tx.del(`gameId:${gameId}:moves`);

            const result = await tx.exec();
            if (!result)
                return socketEmit(
                    socket,
                    "timeout-error",
                    "Failed to make move due to conflict",
                    true
                );
            redisClient.publish(
                `game-over:${gameId}`,
                JSON.stringify({ game, moves })
            );
        }
    } catch (err) {
        console.error(err);
        socketEmit(socket, "timeout-error", "Failed to time out game", true);
    } finally {
        await redisClient.unwatch();
    }
};
