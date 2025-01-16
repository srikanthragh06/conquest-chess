import { Chess } from "chess.js";
import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Piece, Square } from "react-chessboard/dist/chessboard/types";

const ChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [moveLog, setMoveLog] = useState<string[]>([]);

    const getGameStatus = () => {
        if (game.isGameOver()) {
            if (game.isCheckmate()) return "Checkmate";
            if (game.isDraw()) return "Draw";
            if (game.isStalemate()) return "Stalemate";

            return "Game Over!";
        }

        if (game.inCheck()) return "Check ";

        return `${game.turn() === "w" ? "White" : "Black"} to move`;
    };

    const resetGame = () => {
        setGame(new Chess());
        setMoveLog([]);
    };

    const onDrop = (srcSq: Square, tgtSq: Square, piece: Piece) => {
        try {
            const newGame = new Chess(game.fen());
            const move = newGame.move({
                from: srcSq,
                to: tgtSq,
                promotion: piece[1].toLowerCase() ?? "q",
            });
            if (move) {
                setGame(newGame);
                const moveNotation = `${
                    game.turn() === "w" ? "Black" : "White"
                }: ${move.san}`;
                setMoveLog((prev) => {
                    return [...prev, moveNotation];
                });

                return true;
            }
        } catch (error) {
            return false;
        }
        return true;
    };

    useEffect(() => {
        console.log(moveLog);
    }, [moveLog]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <h1 className="text-[40px]">Game Status: {getGameStatus()}</h1>
            <div className="aspect-square w-[90vw] max-w-[90vh]">
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    boardOrientation="black"
                />
            </div>
            <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-[60px] rounded hover:bg-blue-600"
                onClick={resetGame}
            >
                Reset Game
            </button>
        </div>
    );
};

export default ChessGame;
