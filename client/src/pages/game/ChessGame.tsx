import { useRecoilValue } from "recoil";
import useGame from "../../hooks/useGame";
import MovesDisplay from "./MovesDisplay";
import { userDetailsState } from "../../store/auth";
import FormError from "../../components/FormError";
import { Chessboard } from "react-chessboard";
import Timers from "./Timers";

const ChessGame = () => {
    const {
        board,
        game,
        handlePieceDrop,
        handleSquareClick,
        optionSquares,
        moveTo,
        showPromotionDialog,
        onPromotionPieceSelect,
        gameError,
        getGameStatusMsg,
    } = useGame();

    const userDetails = useRecoilValue(userDetailsState);

    return (
        <div className="w-2/3 flex space-x-4 justify-center border-">
            <div className="w-1/2  flex flex-col items-center space-y-3">
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
                {game && <Timers game={game} />}
            </div>
            {game && <MovesDisplay game={game} />}
        </div>
    );
};

export default ChessGame;
