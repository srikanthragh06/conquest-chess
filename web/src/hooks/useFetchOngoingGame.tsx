import { socket } from "@/socket/main";
import { userDetailsState } from "@/store/auth";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";

const useFetchOngoingGame = () => {
    const [ongoingGameId, setOngoingGameId] = useState<string | null>(null);
    const userDetails = useRecoilValue(userDetailsState);

    useEffect(() => {
        if (userDetails.id) socket.emit("ongoing-game");
    }, [userDetails]);

    useEffect(() => {
        socket.on("get-ongoing-game", (gameId: string) => {
            setOngoingGameId(gameId);
        });

        return () => {
            socket.off("get-ongoing-game");
        };
    }, []);

    return { ongoingGameId };
};

export default useFetchOngoingGame;
