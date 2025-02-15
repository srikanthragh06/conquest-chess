// users

import { Chess } from "chess.js";

export type lobbyType = {
    lobbyId: string;
    hostId: string;
    players: string[];
    emptySince: number | null;
};

// lobbies

// const cleanupLobbies = () => {
//     const INACTIVITY_TIMEOUT = 2 * 60 * 1000;
//     const now = Date.now();
//     for (const [lobbyId, lobby] of lobbies) {
//         if (lobby.emptySince && now - lobby.emptySince > INACTIVITY_TIMEOUT) {
//             lobbies.delete(lobbyId);
//         }
//     }
// };
// setInterval(cleanupLobbies, 60 * 1000);

// games
export type moveType = {
    from: string;
    to: string;
    promotion?: string;
    time: number;
};

export type gameType = {
    gameId: string;
    whiteId: string;
    blackId: string;
    fen: string;
    startTime: number;
    gameStatus: gameStatusType;
    drawRejects: {
        w: number;
        b: number;
    };
    drawRequested: {
        w: boolean;
        b: boolean;
    };
};

export type movesType = moveType[];

export type gameStatusType = {
    color: "w" | "b";
    status:
        | "playing"
        | "checkmate"
        | "timeout"
        | "resignation"
        | "forfeit"
        | "stalemate"
        | "threefold-repetition"
        | "insufficient-material"
        | "mutual-draw";
};

export const updateRemainingTime = (game: gameType, moves: movesType) => {
    let whiteTime = 1 * 60 * 1000;
    let blackTime = 1 * 60 * 1000;

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
