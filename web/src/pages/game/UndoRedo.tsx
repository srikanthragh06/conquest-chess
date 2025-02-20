import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { Chess } from "chess.js";
import { movesType } from "../../types/game";
import useUndoRedo from "../../hooks/useUndoRedo";

const UndoRedo = ({
    setBoard,
    moves,
    setInPast,
}: {
    setBoard: React.Dispatch<React.SetStateAction<Chess>>;
    moves: movesType;
    setInPast: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const { handleUndo, handleRedo } = useUndoRedo({
        moves,
        setBoard,
        setInPast,
    });

    return (
        <div className="w-full flex justify-around">
            <FaArrowLeft
                className="cursor-pointer"
                onClick={() => handleUndo()}
            />
            <FaArrowRight
                className="cursor-pointer"
                onClick={() => handleRedo()}
            />
        </div>
    );
};

export default UndoRedo;
