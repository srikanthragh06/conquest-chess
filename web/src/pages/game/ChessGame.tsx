import { useRecoilValue } from "recoil";
import useGame from "../../hooks/useGame";
import MovesDisplay from "./MovesDisplay";
import { isRegisteredState, userDetailsState } from "../../store/auth";
import FormError from "../../components/FormError";
import { Chessboard } from "react-chessboard";
import Timers from "./Timers";
import FormButton from "../../components/FormButton";
import UndoRedo from "./UndoRedo";
import { VscDebugDisconnect } from "react-icons/vsc";

const ChessGame = () => {
    const {
        board,
        setBoard,
        moves,
        game,
        handlePieceDrop,
        handleSquareClick,
        optionSquares,
        moveTo,
        showPromotionDialog,
        onPromotionPieceSelect,
        gameError,
        getGameStatusMsg,
        handleResign,
        handleRequestDraw,
        drawRequest,
        handleAcceptDraw,
        handleRejectDraw,
        setInPast,
    } = useGame();

    const userDetails = useRecoilValue(userDetailsState);
    const isRegistered = useRecoilValue(isRegisteredState);

    const isUserPlayer = game
        ? userDetails.isGuest
            ? [`Guest_${userDetails.id}`].includes(game?.whiteId) ||
              [`Guest_${userDetails.id}`].includes(game?.blackId)
            : [userDetails.id].includes(game?.whiteId) ||
              [userDetails.id].includes(game?.blackId)
        : false;

    return (
        <div className="w-2/3 flex space-x-4 justify-center border-">
            <div className="w-1/2  flex flex-col items-center space-y-3">
                {!isRegistered &&
                    game &&
                    game.gameStatus.status === "playing" && (
                        <div className="flex space-x-2">
                            <VscDebugDisconnect className="text-2xl text-red-600" />
                            <span className="text-base text-red-600">
                                No connection :(
                            </span>
                        </div>
                    )}
                {game && (
                    <h1 className="text-lg font-bold mt-2 mb-1">
                        {game.whiteId} vs {game.blackId}
                    </h1>
                )}
                {game && drawRequest && isUserPlayer && (
                    <div
                        className="flex flex-col w-full justify-evenly 
                                text-base items-center bg-gray-900 rounded-lg
                                py-3 space-y-2
                    "
                    >
                        <p>Your oppernent is suggesting a draw!</p>
                        <div className="flex w-full justify-evenly">
                            <FormButton
                                onClick={handleAcceptDraw}
                                className="bg-gray-800 text-base"
                            >
                                Accept
                            </FormButton>
                            <FormButton
                                onClick={handleRejectDraw}
                                className="bg-gray-800 text-base"
                            >
                                Reject
                            </FormButton>
                        </div>
                    </div>
                )}
                {game &&
                    game.gameStatus.status === "playing" &&
                    isUserPlayer && (
                        <div
                            className="flex w-full justify-evenly
                "
                        >
                            <FormButton
                                className="text-white bg-gray-800 px-7 text-sm mt-3"
                                onClick={handleResign}
                            >
                                Resign
                            </FormButton>
                            <FormButton
                                className="text-white bg-gray-800 px-7 text-sm mt-3"
                                onClick={handleRequestDraw}
                            >
                                Draw
                            </FormButton>
                        </div>
                    )}
                <p>{getGameStatusMsg()}</p>
                <FormError className="text-lg">{gameError}</FormError>
                <Chessboard
                    animationDuration={20}
                    arePiecesDraggable={true}
                    position={board.fen()}
                    onPieceDrop={handlePieceDrop}
                    onSquareClick={handleSquareClick}
                    boardOrientation={
                        userDetails.isGuest
                            ? `Guest_${userDetails.id}` === game?.whiteId
                                ? "white"
                                : "black"
                            : userDetails.id === game?.whiteId
                            ? "white"
                            : "black"
                    }
                    customBoardStyle={{
                        borderRadius: "4px",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                    }}
                    customSquareStyles={optionSquares}
                    promotionToSquare={moveTo}
                    showPromotionDialog={showPromotionDialog}
                    onPromotionPieceSelect={onPromotionPieceSelect}
                />
                {game && moves && game.gameStatus.status === "playing" && (
                    <Timers game={game} moves={moves} />
                )}
                {game && moves && (
                    <UndoRedo
                        setBoard={setBoard}
                        moves={moves}
                        setInPast={setInPast}
                    />
                )}
            </div>
            {moves && <MovesDisplay moves={moves} />}
        </div>
    );
};

export default ChessGame;
