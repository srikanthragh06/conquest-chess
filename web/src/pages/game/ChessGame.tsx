import { userDetailsState } from "@/store/auth";
import { Chessboard } from "react-chessboard";
import { useRecoilValue } from "recoil";
import { FaClock, FaCrown } from "react-icons/fa";
import useTimers from "@/hooks/useTimers";
import { gameType, movesType } from "@/types/game";
import { Chess } from "chess.js";
import {
    CustomSquareStyles,
    Piece,
    PromotionPieceOption,
    Square,
} from "react-chessboard/dist/chessboard/types";
import FormButton from "@/components/FormButton";
import UndoRedo from "./UndoRedo";
import { VscThumbsdownFilled } from "react-icons/vsc";
import { MdThumbsUpDown } from "react-icons/md";
import { FaHourglassEnd } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useRef } from "react";
import { GiChessKing } from "react-icons/gi";

const ChessGame = ({
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
    setInPast,
    handleResign,
    handleRequestDraw,
}: {
    game: gameType;
    moves: movesType;
    board: Chess;
    setBoard: React.Dispatch<React.SetStateAction<Chess>>;
    handlePieceDrop?: (
        sourceSquare: Square,
        targetSquare: Square,
        piece: Piece
    ) => boolean;
    handleSquareClick?: (square: Square, piece?: Piece) => any;
    optionSquares?: CustomSquareStyles;
    moveTo?: Square | null;
    showPromotionDialog?: boolean;
    onPromotionPieceSelect?: (
        piece?: PromotionPieceOption,
        promoteFromSquare?: Square,
        promoteToSquare?: Square
    ) => boolean;
    setInPast: React.Dispatch<React.SetStateAction<boolean>>;
    handleResign: () => void;
    handleRequestDraw: () => void;
}) => {
    const userDetails = useRecoilValue(userDetailsState);
    const { whiteTimeRem, blackTimeRem, formatTime } = useTimers(game, moves);
    if (!game || !moves) return null;

    const opponentId =
        userDetails.id === game.whiteId ? game.blackId : game.whiteId;
    const isWhite = userDetails.id === game.whiteId;
    const isCheckmateOrResignation =
        game.gameStatus.status === "checkmate" ||
        game.gameStatus.status === "resignation";
    const isCheckmate = game.gameStatus.status === "checkmate";
    const isResignation = game.gameStatus.status === "resignation";
    const isTimeout = game.gameStatus.status === "timeout";
    const hasUserWon =
        (userDetails.id === game.whiteId && game.gameStatus.color === "w") ||
        (userDetails.id === game.blackId && game.gameStatus.color === "b");
    const isDraw = [
        "stalemate",
        "threefold-repetition",
        "insufficient-material",
        "mutual-draw",
    ].includes(game.gameStatus.status);

    const boardRef = useRef<HTMLDivElement | null>(null);
    const movesRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const updateHeight = () => {
            if (boardRef.current && movesRef.current) {
                movesRef.current.style.height = `${
                    boardRef.current.clientHeight - 50
                }px`;
            }
        };

        // Run initially
        updateHeight();

        // Observe size changes
        const resizeObserver = new ResizeObserver(updateHeight);
        if (boardRef.current) {
            resizeObserver.observe(boardRef.current);
        }

        return () => resizeObserver.disconnect(); // Cleanup observer
    }, []);

    return (
        <div className="flex flex-col sm:flex-row w-full justify-evenly items-center sm:items-start">
            <div
                className="flex flex-col rounded-xl lg:w-[480px] sm:w-[400px] w-[320px] px-3 py-1"
                ref={boardRef}
            >
                {/* Opponent Info */}
                <div className="flex px-2 py-1 justify-between items-center">
                    <div className="sm:text-sm text-xs flex space-x-2 items-center">
                        {isDraw && (
                            <MdThumbsUpDown className="text-base text-zinc-600" />
                        )}
                        {isTimeout && (
                            <FaHourglassEnd
                                className={`${
                                    !hasUserWon
                                        ? "text-green-700"
                                        : "text-red-700"
                                }`}
                            />
                        )}
                        {isCheckmateOrResignation &&
                            (!hasUserWon ? (
                                <FaCrown className="text-lg text-green-700" />
                            ) : (
                                <VscThumbsdownFilled className="text-lg text-red-700" />
                            ))}
                        <span>{opponentId}</span>
                        {isCheckmate && (
                            <span className="text-zinc-500">{`${
                                !hasUserWon
                                    ? "won by checkmate"
                                    : "lost by checkmate"
                            }`}</span>
                        )}
                        {isResignation && (
                            <span className="text-zinc-500">{`${
                                !hasUserWon
                                    ? "won due to resignation"
                                    : "lost due to resignation"
                            }`}</span>
                        )}
                        {isDraw && (
                            <span className="text-zinc-500">{`draw by ${game.gameStatus.status}`}</span>
                        )}
                        {isTimeout && (
                            <span className="text-zinc-500">{`${
                                !hasUserWon
                                    ? "won by timeout"
                                    : "lost by timeout"
                            }`}</span>
                        )}
                    </div>
                    {game.gameStatus.status === "playing" && (
                        <div className="flex space-x-2 items-center">
                            <FaClock className="text-lg" />
                            <span className="text-base">
                                {formatTime(
                                    isWhite ? blackTimeRem : whiteTimeRem
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Chessboard */}
                <Chessboard
                    animationDuration={20}
                    arePiecesDraggable={true}
                    position={board.fen()}
                    onPieceDrop={handlePieceDrop}
                    onSquareClick={handleSquareClick}
                    boardOrientation={isWhite ? "white" : "black"}
                    customBoardStyle={{
                        borderRadius: "4px",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                    }}
                    customSquareStyles={optionSquares}
                    promotionToSquare={moveTo}
                    showPromotionDialog={showPromotionDialog}
                    onPromotionPieceSelect={onPromotionPieceSelect}
                />

                {/* Player Info */}
                <div className="flex px-2 py-1 justify-between items-center">
                    <div className="sm:text-sm text-xs flex space-x-2 items-center">
                        {isDraw && (
                            <MdThumbsUpDown className="text-base text-zinc-600" />
                        )}
                        {isTimeout && (
                            <FaHourglassEnd
                                className={`${
                                    hasUserWon
                                        ? "text-green-700"
                                        : "text-red-700"
                                }`}
                            />
                        )}
                        {isCheckmateOrResignation &&
                            (hasUserWon ? (
                                <FaCrown className="text-lg text-green-600" />
                            ) : (
                                <VscThumbsdownFilled className="text-lg text-red-700" />
                            ))}
                        <span>{userDetails.id}</span>
                        {isCheckmate && (
                            <span className="text-zinc-500">{`${
                                hasUserWon
                                    ? "won by checkmate"
                                    : "lost by checkmate"
                            }`}</span>
                        )}
                        {isResignation && (
                            <span className="text-zinc-500">{`${
                                hasUserWon
                                    ? "won due to resignation"
                                    : "lost due to resignation"
                            }`}</span>
                        )}
                        {isTimeout && (
                            <span className="text-zinc-500">{`${
                                hasUserWon
                                    ? "won by timeout"
                                    : "lost by timeout"
                            }`}</span>
                        )}
                        {isDraw && (
                            <span className="text-zinc-500">{`draw by ${game.gameStatus.status}`}</span>
                        )}
                    </div>
                    {game.gameStatus.status === "playing" && (
                        <div className="flex space-x-2 items-center">
                            <FaClock className="text-lg" />
                            <span className="text-base">
                                {formatTime(
                                    isWhite ? whiteTimeRem : blackTimeRem
                                )}
                            </span>
                        </div>
                    )}
                </div>

                <UndoRedo
                    setBoard={setBoard}
                    moves={moves}
                    setInPast={setInPast}
                />

                {game.gameStatus.status === "playing" && (
                    <div className="w-full flex justify-around items-center my-2">
                        <FormButton
                            onClick={handleResign}
                            className="bg-zinc-900 px-3 py-1 text-xs border-2 border-zinc-800 shadow-sm"
                        >
                            Resign
                        </FormButton>
                        <FormButton
                            onClick={handleRequestDraw}
                            className="bg-zinc-900 px-3 py-1 text-xs border-2 border-zinc-800 shadow-sm"
                        >
                            Draw
                        </FormButton>
                    </div>
                )}
            </div>
            <ScrollArea
                className="text-white 
                    bg-zinc-900 border-2 border-zinc-800 shadow-sm shadow-zinc-700 
                    px-2 py-1 rounded-lg
                    mt-5"
                ref={movesRef}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="text-white">
                            <TableHead className="text-xs md:text-sm">
                                S No.
                            </TableHead>
                            <TableHead className="text-xs md:text-sm">
                                Turn
                            </TableHead>
                            <TableHead className="text-xs md:text-sm">
                                Move
                            </TableHead>
                            <TableHead className="text-xs md:text-sm">
                                Timestamp
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {moves.map((move, index) => {
                            return (
                                <TableRow
                                    key={index}
                                    className="text-white hover:opacity-90"
                                >
                                    <TableCell className="text-xs md:text-sm">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="text-xs md:text-sm">
                                        <GiChessKing
                                            className={`${
                                                index % 2 == 0
                                                    ? "text-white"
                                                    : "text-zinc-600"
                                            } text-base`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-xs md:text-sm">{`${move.from}${move.to}`}</TableCell>
                                    <TableCell className="text-xs md:text-sm">
                                        {new Date(
                                            move.time
                                        ).toLocaleTimeString()}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default ChessGame;
