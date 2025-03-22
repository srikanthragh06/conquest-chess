import { socket } from "@/socket/main";
import { errorDialogState, openQueueMatchState } from "@/store/page";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";

const useQueueMatch = () => {
    const [isQueueing, setIsQueueing] = useState(false);
    const openQueueMatch = useRecoilValue(openQueueMatchState);
    const [matchType, setMatchType] = useState<"Blitz" | "Rapid" | "Bullet">(
        "Rapid"
    );
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setOpenQueueMatch = useSetRecoilState(openQueueMatchState);

    const navigate = useNavigate();

    useEffect(() => {
        if (isQueueing) {
            socket.emit("queue-match", { matchType });
        }
    }, [isQueueing]);

    useEffect(() => {
        if (!openQueueMatch) {
            setIsQueueing(false);
            socket.emit("cancel-queue");
        }
    }, [openQueueMatch]);

    useEffect(() => {
        socket.on("started-game", (gameId) => {
            navigate(`/game/${gameId}`);
            setOpenQueueMatch(false);
        });
        socket.on("start-game-error", (msg: string) => {
            setErrorDialog(msg);
        });

        return () => {
            socket.off("started-game");
            socket.off("start-game-error");
        };
    }, [setErrorDialog, navigate]);

    return { isQueueing, setIsQueueing, matchType, setMatchType };
};

export default useQueueMatch;
