import useGame from "@/hooks/useGame";
import MainPage from "../../components/MainPage";
import ChessGame from "./ChessGame";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "../../components/ui/dialog";
import FormButton from "@/components/FormButton";

const GamePage = () => {
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
        handleResign,
        handleRequestDraw,
        drawRequest,
        handleAcceptDraw,
        handleRejectDraw,
        setInPast,
    } = useGame();

    return (
        <MainPage hasNavbar={true} className="items-center">
            {game && moves && (
                <ChessGame
                    game={game}
                    moves={moves}
                    board={board}
                    setBoard={setBoard}
                    handlePieceDrop={handlePieceDrop}
                    handleSquareClick={handleSquareClick}
                    optionSquares={optionSquares}
                    moveTo={moveTo}
                    showPromotionDialog={showPromotionDialog}
                    onPromotionPieceSelect={onPromotionPieceSelect}
                    setInPast={setInPast}
                    handleResign={handleResign}
                    handleRequestDraw={handleRequestDraw}
                />
            )}
            {game && moves && (
                <Dialog open={drawRequest}>
                    <DialogContent className="bg-zinc-900 text-white border-none">
                        <DialogTitle className="text-sm">
                            The oppernent is requesting a draw
                        </DialogTitle>
                        <DialogDescription className="w-full flex justify-around">
                            <FormButton
                                className="text-white text-sm "
                                onClick={handleAcceptDraw}
                            >
                                Accept
                            </FormButton>
                            <FormButton
                                className="text-white text-sm "
                                onClick={handleRejectDraw}
                            >
                                Reject
                            </FormButton>
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            )}
        </MainPage>
    );
};

export default GamePage;
