import { Chess } from "chess.js";
import { gameType, movesType } from "../type/state";
import { queryClient, transaction } from "../db/postgres";
import { findOneWithCondition, insertRecord } from "../db/queries";

export const updateRemainingTime = (game: gameType, moves: movesType) => {
    let whiteTime =
        game.type === "Rapid"
            ? 10 * 60 * 1000
            : game.type === "Blitz"
            ? 3 * 60 * 1000
            : 1 * 60 * 1000;
    let blackTime =
        game.type === "Rapid"
            ? 10 * 60 * 1000
            : game.type === "Blitz"
            ? 3 * 60 * 1000
            : 1 * 60 * 1000;

    for (let i = 0; i < moves.length; i += 2) {
        whiteTime -=
            moves[i].time - (i === 0 ? game.startTime : moves[i - 1].time);
    }
    for (let i = 1; i < moves.length; i += 2) {
        blackTime -= moves[i].time - moves[i - 1].time;
    }

    if (moves.length % 2 === 0) {
        whiteTime -=
            Date.now() -
            (moves.length === 0
                ? game.startTime
                : moves[moves.length - 1].time);
    } else {
        blackTime -= Date.now() - moves[moves.length - 1].time;
    }

    if (whiteTime <= 0) {
        game.gameStatus.status = "timeout";
        game.gameStatus.color = "b";
    }
    if (blackTime <= 0) {
        game.gameStatus.status = "timeout";
        game.gameStatus.color = "w";
    }

    return { whiteTime, blackTime };
};

export const updateGameEnd = (game: gameType, moves: movesType) => {
    const board = new Chess(game.fen);

    if (board.isCheckmate()) {
        game.gameStatus.color = moves.length % 2 === 1 ? "w" : "b";
        game.gameStatus.status = "checkmate";
    } else if (board.isStalemate()) {
        game.gameStatus.status = "stalemate";
    } else if (board.isThreefoldRepetition()) {
        game.gameStatus.status = "threefold-repetition";
    } else if (board.isInsufficientMaterial()) {
        game.gameStatus.status = "insufficient-material";
    }
    return game.gameStatus.status !== "playing";
};

export const saveGameInDB = async (game: gameType, moves: movesType) => {
    try {
        await transaction(async (client) => {
            await insertRecord(
                client,
                "Games",
                {
                    game_id: game.gameId,
                    type: game.type,
                    white_id: game.whiteId,
                    black_id: game.blackId,
                    fen: game.fen,
                    start_time: new Date(game.startTime).toISOString(),
                    game_status: game.gameStatus.status,
                    winner: game.gameStatus.color,
                },
                "game_id"
            );

            moves.forEach(async (move) => {
                await insertRecord(
                    client,
                    "Moves",
                    {
                        game_id: game.gameId,
                        from_square: move.from,
                        to_square: move.to,
                        promotion: move.promotion,
                        time: new Date(move.time).toISOString(),
                    },
                    "move_id"
                );
            });
        });
    } catch (err) {
        console.error(err);
    }
};

export const getGameInDB = async (gameId: string) => {
    let gameData;
    try {
        await transaction(async (client) => {
            const game = await findOneWithCondition(
                client,
                "Games",
                [
                    "game_id",
                    "type",
                    "white_id",
                    "black_id",
                    "fen",
                    "start_time",
                    "game_status",
                    "winner",
                ],
                {
                    game_id: gameId,
                }
            );
            gameData = {
                gameId: game.game_id,
                type: game.type,
                whiteId: game.white_id,
                blackId: game.black_id,
                fen: game.fen,
                startTime: new Date(game.start_time).getTime(),
                gameStatus: { color: game.winner, status: game.game_status },
            };
        });
        return gameData;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const getMovesInDB = async (gameId: string) => {
    let movesData;
    try {
        await transaction(async (client) => {
            const moves = await queryClient(
                client,
                `SELECT from_square,to_square,promotion,time FROM "Moves" WHERE "game_id" = $1 ORDER BY time`,
                [gameId]
            );
            movesData = moves.rows.map((move) => ({
                from: move.from_square,
                to: move.to_square,
                promotion: move.promotion,
                time: new Date(move.time).getTime(),
            }));
        });
        return movesData;
    } catch (err) {
        console.error(err);
        return null;
    }
};
