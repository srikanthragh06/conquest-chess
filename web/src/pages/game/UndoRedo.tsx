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
        <div className="w-full flex justify-between px-2">
            <div
                onClick={() => handleUndo()}
                onMouseDown={(e) => e.preventDefault()}
                className="hover:opacity-80 active:opacity-60"
            >
                <FaArrowLeft className="cursor-pointer text-xl" />
            </div>

            <div
                onClick={() => handleRedo()}
                onMouseDown={(e) => e.preventDefault()}
                className="hover:opacity-80 active:opacity-60"
            >
                <FaArrowRight className="cursor-pointer text-xl" />
            </div>
        </div>
    );
};

export default UndoRedo;
