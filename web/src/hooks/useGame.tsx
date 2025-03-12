import { useEffect, useState } from "react";
import { socket } from "../socket/main";
import { Chess, Move } from "chess.js";
import { useParams } from "react-router-dom";
import {
    PromotionPieceOption,
    Square,
} from "react-chessboard/dist/chessboard/types";
import { isRegisteredState, userDetailsState } from "../store/auth";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { gameType, movesType } from "../types/game";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
    isLoadingPageState,
    loadingTextState,
} from "@/store/page";

const useGame = () => {
    const { gameId } = useParams();
    const userDetails = useRecoilValue(userDetailsState);
    const isRegistered = useRecoilValue(isRegisteredState);

    const [game, setGame] = useState<gameType | null>(null);
    const [moves, setMoves] = useState<movesType | null>(null);

    const [board, setBoard] = useState(new Chess());
    const [moveFrom, setMoveFrom] = useState<Square | null>(null);
    const [moveTo, setMoveTo] = useState<Square | null>(null);
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);
    const [optionSquares, setOptionSquares] = useState<
        Record<string, { background: string; borderRadius?: string }>
    >({});
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [_, setGameError] = useState<string | null>(null);

    const [drawRequest, setDrawRequest] = useState(false);

    const [inPast, setInPast] = useState(false);

    const setErrorTitle = useSetRecoilState(errorTitleState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);

    const setIsLoadingPage = useSetRecoilState(isLoadingPageState);
    const setLoadingText = useSetRecoilState(loadingTextState);

    const isValidTurn = () => {
        const userId = userDetails.id;

        return (
            (userId === game?.whiteId && board.turn() === "w") ||
            (userId === game?.blackId && board.turn() === "b")
        );
    };

    const highlightMoveOptions = (square: Square): boolean => {
        const moves = board.moves({ square, verbose: true }) as Move[];
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
                    board.get(move.to)?.color !== board.get(square)?.color
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
        if (!isValidTurn()) return;

        if (!moveFrom) {
            if (highlightMoveOptions(square)) setMoveFrom(square);
            return;
        }

        const moves = board.moves({
            square: moveFrom,
            verbose: true,
        }) as Move[];
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
        if (!isValidTurn()) return;
        if (game && game.gameStatus.status !== "playing") return;
        const isUserPlayer = game
            ? [userDetails.id].includes(game?.whiteId) ||
              [userDetails.id].includes(game?.blackId)
            : false;
        if (!isUserPlayer) return;
        if (inPast) return;
        if (!isRegistered) return;

        const updatedBoard = new Chess(board.fen());
        updatedBoard.move({ from, to, promotion });
        setBoard(updatedBoard);
        setMoveFrom(null);
        setMoveTo(null);
        setOptionSquares({});
        setIsWhiteTurn(!isWhiteTurn);
        socket.emit("make-move", { gameId, move: { from, to, promotion } });
    };

    const handlePieceDrop = (srcSq: Square, tgtSq: Square): boolean => {
        const updatedBoard = new Chess(board.fen());
        try {
            const move = updatedBoard.move({
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
                const tempBoard = new Chess(board.fen());
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
                const tempBoard = new Chess(board.fen());
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

    const getGameStatusMsg = () => {
        if (!game || !moves) return "";

        if (game.gameStatus.status === "playing") {
            if (moves.length % 2 === 0) return "White to play!";
            else return "Black to play!";
        } else if (game.gameStatus.status === "checkmate") {
            if (game.gameStatus.color === "w") return "White wins by checkmate";
            else return "Black wins by checkmate";
        } else if (game.gameStatus.status === "stalemate") {
            return "Stalemate, Draw!";
        } else if (game.gameStatus.status === "threefold-repetition") {
            return "Threefold-repetition, Draw!";
        } else if (game.gameStatus.status === "insufficient-material") {
            return "Insufficient Material, Draw!";
        } else if (game.gameStatus.status === "timeout") {
            if (game.gameStatus.color === "b")
                return "White timed out, Black wins";
            else return "Black timed out, White wins";
        } else if (game.gameStatus.status === "resignation") {
            if (game.gameStatus.color === "b")
                return "White resigns, Black wins";
            else return "Black resigns, White wins";
        } else if (game.gameStatus.status === "mutual-draw") {
            return "Mutual Draw";
        } else return "";
    };

    const handleResign = () => {
        socket.emit("resign", gameId);
    };

    const handleRequestDraw = () => {
        socket.emit("request-draw", gameId);
    };

    const handleAcceptDraw = () => {
        setDrawRequest(false);
        socket.emit("accept-draw", gameId);
    };

    const handleRejectDraw = () => {
        setDrawRequest(false);
        socket.emit("reject-draw", gameId);
    };

    useEffect(() => {
        if (gameId && isRegistered) {
            socket.emit("get-game", gameId);
            setIsLoadingPage(true);
            setLoadingText("Joining Game");
        }

        socket.on(
            "get-full-game",
            ({
                game: serverGame,
                moves: serverMoves,
            }: {
                game: gameType;
                moves: movesType;
            }) => {
                const updatedBoard = new Chess(serverGame.fen);
                setGame(serverGame);
                setMoves(serverMoves);
                setBoard(updatedBoard);
                setGameError(null);
                setIsLoadingPage(false);
            }
        );

        socket.on(
            "game-update",
            ({
                game: serverGame,
                moves: serverMoves,
            }: {
                game: gameType;
                moves: movesType;
            }) => {
                const updatedBoard = new Chess(serverGame.fen);
                setGame(serverGame);
                setMoves(serverMoves);
                setBoard(updatedBoard);
                setGameError(null);
                socket.emit("get-time", gameId);
                setIsLoadingPage(false);
            }
        );

        socket.on("get-game-error", (msg: string) => {
            setIsErrorDialog(true);
            setErrorTitle("Game Error");
            setErrorDialog(msg);
            setIsLoadingPage(false);
        });

        socket.on("make-move-error", (msg) => {
            setIsErrorDialog(true);
            setErrorTitle("Move error");
            setErrorDialog(msg);
            const updatedBoard = new Chess(board.fen());
            updatedBoard.undo();
            setBoard(updatedBoard);
        });

        socket.on("game-over", ({ game: serverGame, moves: serverMoves }) => {
            const updatedBoard = new Chess(serverGame.fen);
            setGame(serverGame);
            setBoard(updatedBoard);
            setMoves(serverMoves);
            setGameError(null);
        });

        socket.on("request-draw", () => {
            setDrawRequest(true);
        });

        return () => {
            socket.off("game-update");
            socket.off("get-full-game");
            socket.off("game-over");
            socket.off("get-game-error");
            socket.off("make-move-error");
            socket.off("time-update");
            socket.off("request-draw");
        };
    }, [setGame, setGameError, gameId, isRegistered]);

    return {
        game,
        moves,
        board,
        setBoard,
        handlePieceDrop,
        handleSquareClick,
        optionSquares,
        moveTo,
        showPromotionDialog,
        onPromotionPieceSelect,
        getGameStatusMsg,
        handleResign,
        handleRequestDraw,
        drawRequest,
        handleAcceptDraw,
        handleRejectDraw,
        inPast,
        setInPast,
    };
};

export default useGame;
