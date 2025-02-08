// users

import { Chess } from "chess.js";

export const socket2User: Map<string, string> = new Map();
export const user2Socket: Map<string, string> = new Map();

export type lobbyType = {
    lobbyId: string;
    hostId: string;
    players: string[];
    emptySince: number | null;
};

// lobbies

export const lobbies: Map<string, lobbyType> = new Map();
export const user2Lobby: Map<string, string> = new Map();

const cleanupLobbies = () => {
    const INACTIVITY_TIMEOUT = 2 * 60 * 1000;
    const now = Date.now();
    for (const [lobbyId, lobby] of lobbies) {
        if (lobby.emptySince && now - lobby.emptySince > INACTIVITY_TIMEOUT) {
            lobbies.delete(lobbyId);
        }
    }
};
setInterval(cleanupLobbies, 60 * 1000);

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
    board: Chess;
    moves: moveType[];
    startTime: number;
    gameStatus: gameStatusType;
};

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

export const games: Map<string, gameType> = new Map();
export const user2Game: Map<string, string> = new Map();

export const updateRemainingTime = (game: gameType) => {
    let whiteTime = 1 * 60 * 1000;
    let blackTime = 1 * 60 * 1000;

    for (let i = 0; i < game.moves.length; i += 2) {
        whiteTime -=
            game.moves[i].time -
            (i === 0 ? game.startTime : game.moves[i - 1].time);
    }
    for (let i = 1; i < game.moves.length; i += 2) {
        blackTime -= game.moves[i].time - game.moves[i - 1].time;
    }

    if (game.moves.length % 2 === 0) {
        whiteTime -=
            Date.now() -
            (game.moves.length === 0
                ? game.startTime
                : game.moves[game.moves.length - 1].time);
    } else {
        blackTime -= Date.now() - game.moves[game.moves.length - 1].time;
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

export const updateGameEnd = (game: gameType) => {
    if (game.board.isCheckmate()) {
        game.gameStatus.color = game.moves.length % 2 === 1 ? "w" : "b";
        game.gameStatus.status = "checkmate";
    } else if (game.board.isStalemate()) {
        game.gameStatus.status = "stalemate";
    } else if (game.board.isThreefoldRepetition()) {
        game.gameStatus.status = "threefold-repetition";
    } else if (game.board.isInsufficientMaterial()) {
        game.gameStatus.status = "insufficient-material";
    }
    return game.gameStatus.status !== "playing";
};
