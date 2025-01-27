import { Chess, Move } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import {
    PromotionPieceOption,
    Square,
} from "react-chessboard/dist/chessboard/types";

const ChessGame2 = () => {
    const [game, setGame] = useState(new Chess());
    const [moveFrom, setMoveFrom] = useState<Square | null>(null);
    const [moveTo, setMoveTo] = useState<Square | null>(null);
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);
    const [optionSquares, setOptionSquares] = useState<
        Record<string, { background: string; borderRadius?: string }>
    >({});
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);

    const highlightMoveOptions = (square: Square): boolean => {
        const moves = game.moves({ square, verbose: true }) as Move[];
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: Record<
            string,
            { background: string; borderRadius?: string }
        > = {};
        moves.forEach((move) => {
            newSquares[move.to] = {
                background:
                    game.get(move.to)?.color !== game.get(square)?.color
                        ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                        : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                borderRadius: "50%",
            };
        });
        newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
        setOptionSquares(newSquares);
        return true;
    };

    const handleSquareClick = (square: Square): void => {
        if (!moveFrom) {
            if (highlightMoveOptions(square)) setMoveFrom(square);
            return;
        }

        const moves = game.moves({ square: moveFrom, verbose: true }) as Move[];
        const validMove = moves.find(
            (m) => m.from === moveFrom && m.to === square
        );

        if (!validMove) {
            if (highlightMoveOptions(square)) setMoveFrom(square);
            else setMoveFrom(null);
            return;
        }

        setMoveTo(square);

        if (
            validMove.piece === "p" &&
            ((validMove.color === "w" && square[1] === "8") ||
                (validMove.color === "b" && square[1] === "1"))
        ) {
            setShowPromotionDialog(true);
            return;
        }

        makeMove(moveFrom, square, "q");
    };

    const makeMove = (from: Square, to: Square, promotion: string) => {
        const updatedGame = new Chess(game.fen());
        updatedGame.move({ from, to, promotion });
        setGame(updatedGame);
        setMoveFrom(null);
        setMoveTo(null);
        setOptionSquares({});
        setIsWhiteTurn(!isWhiteTurn);
    };

    const handlePieceDrop = (srcSq: Square, tgtSq: Square): boolean => {
        const updatedGame = new Chess(game.fen());
        try {
            const move = updatedGame.move({
                from: srcSq,
                to: tgtSq,
                promotion: "q",
            });

            if (move) {
                makeMove(srcSq, tgtSq, "q");
                return true;
            }

            return false;
        } catch (err) {
            return false;
        }
    };

    const onPromotionPieceSelect = (
        piece: PromotionPieceOption | undefined,
        promoteFromSquare: Square | undefined,
        promoteToSquare: Square | undefined
    ) => {
        if (piece && moveFrom && moveTo) {
            try {
                const tempBoard = new Chess(game.fen());
                const move = tempBoard.move({
                    from: moveFrom,
                    to: moveTo,
                    promotion: piece[1].toLowerCase() ?? "q",
                });
                if (move) {
                    makeMove(moveFrom, moveTo, piece[1].toLowerCase() ?? "q");
                    return true;
                }
            } catch (err) {
                resetMoveState();
                return false;
            }
        } else if (piece && promoteFromSquare && promoteToSquare) {
            try {
                const tempBoard = new Chess(game.fen());
                const move = tempBoard.move({
                    from: promoteFromSquare,
                    to: promoteToSquare,
                    promotion: piece[1].toLowerCase() ?? "q",
                });
                if (move) {
                    makeMove(
                        promoteFromSquare,
                        promoteToSquare,
                        piece[1].toLowerCase() ?? "q"
                    );
                    return true;
                }
            } catch (err) {
                resetMoveState();
                return false;
            }
        }
        resetMoveState();
        return false;
    };

    const resetMoveState = () => {
        setMoveFrom(null);
        setMoveTo(null);
        setShowPromotionDialog(false);
        setOptionSquares({});
    };

    return (
        <div className="w-1/2">
            <Chessboard
                id="ClickToMove"
                animationDuration={20}
                arePiecesDraggable={true}
                position={game.fen()}
                onPieceDrop={handlePieceDrop}
                onSquareClick={handleSquareClick}
                customBoardStyle={{
                    borderRadius: "4px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                }}
                customSquareStyles={optionSquares}
                promotionToSquare={moveTo}
                showPromotionDialog={showPromotionDialog}
                onPromotionPieceSelect={onPromotionPieceSelect}
            />
        </div>
    );
};

export default ChessGame2;
