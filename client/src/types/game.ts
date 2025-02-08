import { Chess } from "chess.js";

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
