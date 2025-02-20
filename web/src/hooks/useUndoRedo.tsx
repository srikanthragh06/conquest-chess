import React, { useEffect, useRef } from "react";
import { movesType } from "../types/game";
import { Chess } from "chess.js";

const useUndoRedo = ({
    moves,
    setBoard,
    setInPast,
}: {
    moves: movesType;
    setBoard: React.Dispatch<React.SetStateAction<Chess>>;
    setInPast: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const movePtr = useRef<number>(moves.length - 1);

    const handleUndo = () => {
        if (movePtr.current > -1)
            setBoard(() => {
                setInPast(true);
                const tempBoard = new Chess();
                movePtr.current -= 1;
                for (let i = 0; i <= movePtr.current; i++)
                    tempBoard.move(moves[i]);
                return tempBoard;
            });
    };

    const handleRedo = () => {
        if (movePtr.current < moves.length - 1)
            setBoard(() => {
                const tempBoard = new Chess();
                movePtr.current += 1;
                if (movePtr.current === moves.length - 1) setInPast(false);
                for (let i = 0; i <= movePtr.current; i++)
                    tempBoard.move(moves[i]);
                return tempBoard;
            });
    };

    useEffect(() => {
        movePtr.current = moves.length - 1;
    }, [moves]);

    return { handleUndo, handleRedo };
};

export default useUndoRedo;
