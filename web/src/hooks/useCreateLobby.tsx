import { useRecoilValue, useSetRecoilState } from "recoil";
import { socket } from "../socket/main";
import { useEffect } from "react";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
    isLoadingPageState,
} from "@/store/page";
import { useNavigate } from "react-router-dom";
import { loadingTextState } from "../store/page";
import { isRegisteredState } from "@/store/auth";

const useCreateLobby = () => {
    const isRegistered = useRecoilValue(isRegisteredState);
    const setLoadingText = useSetRecoilState(loadingTextState);
    const setIsLoadingPage = useSetRecoilState(isLoadingPageState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);

    const navigate = useNavigate();

    const handleCreateLobby = () => {
        if (!isRegistered) return;
        socket.emit("create-lobby");
        setLoadingText("Creating Lobby");
        setIsLoadingPage(true);
    };

    useEffect(() => {
        socket.on("created-lobby", (newLobbyId: string) => {
            setIsLoadingPage(false);
            socket.off("created-lobby");
            navigate(`/lobby/${newLobbyId}`);
        });

        socket.on("create-lobby-error", (error: string) => {
            setIsErrorDialog(true);
            setIsLoadingPage(false);
            setErrorDialog(error);
            setErrorTitle("Create Lobby Error");
        });

        return () => {
            socket.off("create-lobby-error");
        };
    }, [navigate]);

    return { handleCreateLobby };
};

export default useCreateLobby;
