import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket/main";
import { useRecoilValue } from "recoil";
import { isRegisteredState } from "../store/auth";

const useLobby = () => {
    type lobbyType = {
        lobbyId: string;
        hostId: string;
        players: string[];
    };

    const { lobbyId } = useParams();
    const [lobbyDetails, setLobbyDetails] = useState<lobbyType | null>(null);
    const [lobbyDetailsError, setLobbyDetailsError] = useState<string | null>(
        null
    );
    const isRegisterd = useRecoilValue(isRegisteredState);

    useEffect(() => {
        if (lobbyId && isRegisterd) {
            socket.emit("join-lobby", lobbyId);
            socket.on("lobby-details", (lobby: lobbyType) => {
                console.log({ lobby });
                setLobbyDetailsError(null);
                setLobbyDetails(lobby);
            });
            socket.on("lobby-details-error", (msg: string) => {
                setLobbyDetails(null);
                setLobbyDetailsError(msg);
            });
        }

        return () => {
            socket.off("lobby-details");
        };
    }, [lobbyId, isRegisterd]);

    return { lobbyId, lobbyDetails, lobbyDetailsError };
};

export default useLobby;
