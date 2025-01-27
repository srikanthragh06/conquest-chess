import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Piece, Square } from "react-chessboard/dist/chessboard/types";
import { Socket } from "socket.io-client";

const ChessGame = ({
    socket,
    boardOrientation,
    roomId,
    game,
}: {
    socket: Socket | null;
    boardOrientation: "white" | "black";
    roomId: string;
    game: Chess;
}) => {
    const getGameStatus = () => {
        if (game.isGameOver()) {
            if (game.isCheckmate()) return "Checkmate";
            if (game.isDraw()) return "Draw";
            if (game.isStalemate()) return "Stalemate";

            return "Game Over!";
        }

        if (game.inCheck()) return "Check";

        return `${game.turn() === "w" ? "White" : "Black"} to move`;
    };

    const onDrop = (srcSq: Square, tgtSq: Square, piece: Piece) => {
        // Prevent the opponent from moving
        if (
            (game.turn() === "w" && boardOrientation === "black") ||
            (game.turn() === "b" && boardOrientation === "white")
        )
            return false;

        try {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({
                from: srcSq,
                to: tgtSq,
                promotion: piece[1].toLowerCase() ?? "q",
            });
            if (move && socket) {
                socket.emit("make-move", { roomId, move: move.san });
                return false;
            } else {
                console.log("wrong move");
            }
        } catch (error) {
            return false;
        }
        return false;
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white">
            <h1 className="text-lg m-1">Room ID: {roomId}</h1>
            <h1 className="text-lg">Game Status: {getGameStatus()}</h1>
            <div className="aspect-square w-[600px] max-w-[90vh]">
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    boardOrientation={boardOrientation}
                />
            </div>
        </div>
    );
};

export default ChessGame;
