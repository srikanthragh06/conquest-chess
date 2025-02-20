import { FormEvent, useEffect, useState } from "react";
import { socket } from "../socket/main";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { isRegisteredState } from "../store/auth";

const useJoinLobby = () => {
    const navigate = useNavigate();
    const [joinLobbyId, setJoinLobbyId] = useState("");
    const [joinLobbyError, setJoinLobbyError] = useState<string | null>(null);
    const isRegistered = useRecoilValue(isRegisteredState);

    const handleJoinLobby = (e: FormEvent) => {
        e.preventDefault();
        socket.emit("join-lobby", joinLobbyId);
    };

    useEffect(() => {
        if (isRegistered) {
            socket.on("joined-lobby", () => {
                setJoinLobbyError(null);
                navigate(`/lobby/${joinLobbyId}`);
            });
            socket.on("lobby-details-error", (msg: string) => {
                setJoinLobbyError(msg);
            });
        }

        return () => {
            socket.off("joined-lobby");
            socket.off("lobby-details-error");
        };
    }, [isRegistered, navigate, joinLobbyId]);

    return { joinLobbyId, setJoinLobbyId, joinLobbyError, handleJoinLobby };
};

export default useJoinLobby;
