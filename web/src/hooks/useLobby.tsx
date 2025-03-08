import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket/main";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isRegisteredState, userDetailsState } from "../store/auth";
import { lobbyType } from "../types/lobby";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
    isLoadingPageState,
    loadingTextState,
} from "@/store/page";

const useLobby = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [lobbyDetails, setLobbyDetails] = useState<lobbyType | null>(null);
    const [lobbyDetailsError, setLobbyDetailsError] = useState<string | null>(
        null
    );

    const [startGameError, setStartGameError] = useState<string | null>(null);
    const setLoadingText = useSetRecoilState(loadingTextState);
    const setIsLoadingPage = useSetRecoilState(isLoadingPageState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);

    const isRegistered = useRecoilValue(isRegisteredState);

    const handleStartGame = (e: FormEvent) => {
        e.preventDefault();
        if (
            !lobbyDetails ||
            !lobbyDetails.participants[0] ||
            !lobbyDetails.participants[1] ||
            lobbyDetails.hostId !== userDetails.id
        )
            return;
        socket.emit("start-game", {
            lobbyId: lobbyDetails.lobbyId,
        });
    };

    const handleMatchTypeSelect = (type: "Blitz" | "Rapid" | "Bullet") => {
        if (lobbyDetails && lobbyDetails.hostId === userDetails.id) {
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

    const handleClickPlayer = (userId: string) => {
        if (!lobbyDetails || lobbyDetails.hostId !== userDetails.id) return;

        setLobbyDetails((prev) => {
            if (!prev) return prev;

            const newParticipants: [string | null, string | null] = [
                ...prev.participants,
            ];

            if (prev.participants.includes(userId)) {
                if (userId === prev.participants[0]) {
                    newParticipants[0] = null;
                } else {
                    newParticipants[1] = null;
                }
            } else {
                if (newParticipants[0] === null) {
                    newParticipants[0] = userId;
                } else if (newParticipants[1] === null) {
                    newParticipants[1] = userId;
                } else {
                    newParticipants[0] = userId;
                }
            }

            socket.emit("participants-select", {
                lobbyId: prev.lobbyId,
                newParticipants,
            });

            return {
                ...prev,
                participants: newParticipants,
            };
        });
    };

    useEffect(() => {
        if (lobbyId && isRegistered) {
            socket.emit("join-lobby", lobbyId);
            setLoadingText("Joining lobby");
            setIsLoadingPage(true);
            socket.on("lobby-details", (lobby: lobbyType) => {
                setLobbyDetailsError(null);
                setLobbyDetails(lobby);
                setIsLoadingPage(false);
            });
            socket.on("lobby-details-error", (msg: string) => {
                setLobbyDetails(null);
                setLobbyDetailsError(msg);
                setIsErrorDialog(true);
                setIsLoadingPage(false);
                setErrorDialog(msg);
                setErrorTitle("Lobby Error");
            });
            socket.on("join-lobby-error", (error: string) => {
                setIsErrorDialog(true);
                setIsLoadingPage(false);
                setErrorDialog(error);
                setErrorTitle("Join Lobby Error");
            });
        }

        return () => {
            socket.off("lobby-details");
            socket.off("lobby-details-error");
        };
    }, [lobbyId, isRegistered]);

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
    }, [lobbyId]);

    return {
        lobbyId,
        lobbyDetails,
        lobbyDetailsError,
        handleStartGame,
        startGameError,
        handleMatchTypeSelect,
        handleClickPlayer,
    };
};

export default useLobby;
