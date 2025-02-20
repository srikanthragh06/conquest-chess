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

    const [matchType, setMatchType] = useState<"Blitz" | "Rapid" | "Bullet">(
        "Blitz"
    );

    const handleStartGame = (e: FormEvent) => {
        e.preventDefault();
        if (lobbyDetails) {
            socket.emit("start-game", {
                lobbyId: lobbyDetails.lobbyId,
                matchType,
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
            setMatchType(type);
            socket.emit("match-select", { lobbyId, matchType: type });
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
            socket.on(
                "match-select",
                (matchType: "Rapid" | "Blitz" | "Bullet") => {
                    console.log(matchType);
                    setMatchType(matchType);
                }
            );
        }

        return () => {
            socket.off("lobby-details");
            socket.off("match-select");
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

    return {
        lobbyId,
        lobbyDetails,
        lobbyDetailsError,
        handleStartGame,
        startGameError,
        matchType,
        handleMatchTypeSelect,
    };
};

export default useLobby;
