import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket/main";
import { useRecoilValue } from "recoil";
import { isRegisteredState, userDetailsState } from "../store/auth";
import { lobbyType } from "../types/lobby";

const useLobby = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [lobbyDetails, setLobbyDetails] = useState<lobbyType | null>(null);
    const [lobbyDetailsError, setLobbyDetailsError] = useState<string | null>(
        null
    );
    const [startGameError, setStartGameError] = useState<string | null>(null);

    const isRegisterd = useRecoilValue(isRegisteredState);

    const handleStartGame = (e: FormEvent) => {
        e.preventDefault();
        if (lobbyDetails) {
            socket.emit("start-game", {
                lobbyId: lobbyDetails.lobbyId,
            });
        }
    };

    const handleMatchTypeSelect = (type: "Blitz" | "Rapid" | "Bullet") => {
        if (
            lobbyDetails &&
            (userDetails.isGuest
                ? lobbyDetails.hostId === "Guest_" + userDetails.id
                : lobbyDetails.hostId === userDetails.id)
        ) {
            if (lobbyDetails) {
                setLobbyDetails((prev) => {
                    if (!prev) return prev;
                    return { ...prev, matchType: type };
                });
                socket.emit("match-select", {
                    lobbyId,
                    matchType: type,
                });
            }
        }
    };

    useEffect(() => {
        if (lobbyId && isRegisterd) {
            socket.emit("join-lobby", lobbyId);
            socket.on("lobby-details", (lobby: lobbyType) => {
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
            socket.off("lobby-details-error");
        };
    }, [lobbyId, isRegisterd]);

    useEffect(() => {
        socket.on("started-game", (gameId) => {
            setStartGameError(null);
            navigate(`/game/${gameId}`);
        });
        socket.on("start-game-error", (msg: string) => {
            setStartGameError(msg);
        });

        return () => {
            socket.off("started-game");
            socket.off("start-game-error");
        };
    }, [setStartGameError, navigate]);

    useEffect(() => {
        return () => {
            socket.emit("leave-lobby", { lobbyId });
        };
    }, []);

    return {
        lobbyId,
        lobbyDetails,
        lobbyDetailsError,
        handleStartGame,
        startGameError,
        handleMatchTypeSelect,
    };
};

export default useLobby;
