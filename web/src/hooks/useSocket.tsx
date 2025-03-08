import { useEffect, useState } from "react";
import { socket } from "../socket/main";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isRegisteredState, userDetailsState } from "../store/auth";
import { getAuthToken, removeAuthToken, setAuthToken } from "../utils/token";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
    isRegisteringState,
} from "../store/page";
import { pingState } from "@/store/connection";

const useSocket = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setUserDetails = useSetRecoilState(userDetailsState);
    const setIsRegistered = useSetRecoilState(isRegisteredState);
    const setIsRegistering = useSetRecoilState(isRegisteringState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);
    const setPing = useSetRecoilState(pingState);

    const [isSocketConnected, setIsSocketConnected] = useState(false);

    const registerUser = () => {
        const authToken = getAuthToken();

        setIsRegistering(true);
        socket.emit("register-user", { authToken });
    };

    const handleRegisterUserError = (errMsg: string) => {
        removeAuthToken();
        setIsRegistering(false);
        setIsRegistered(false);
        setIsErrorDialog(true);
        setErrorDialog(errMsg);
        setErrorTitle("Authorization Error");
    };

    const handleRegisteredUser = (
        authToken: string,
        userId: string,
        isGuest: boolean
    ) => {
        setAuthToken(authToken);
        setUserDetails({ id: userId, isGuest });
        setIsRegistered(true);
        setIsRegistering(false);
    };

    useEffect(() => {
        setIsRegistering(true);
        socket.connect();
    }, []);

    useEffect(() => {
        let startTime: number;
        let intervalId: NodeJS.Timeout;
        let timeoutId: NodeJS.Timeout;

        socket.on("connect", () => {
            setIsSocketConnected(true);
            startTime = Date.now();
            socket.emit("ping");

            intervalId = setInterval(() => {
                if (Date.now() - startTime > 5000) setPing(5000);
                startTime = Date.now();
                socket.emit("ping");
                timeoutId = setTimeout(() => setPing(5000), 5000);
            }, 5000);
        });

        socket.on("pong", () => {
            clearTimeout(timeoutId);
            setPing(Date.now() - startTime);
        });

        socket.on(
            "registered-user",
            ({
                authToken,
                userId,
                isGuest,
            }: {
                authToken: string;
                userId: string;
                isGuest: boolean;
            }) => handleRegisteredUser(authToken, userId, isGuest)
        );

        socket.on("register-user-error", (errMsg) =>
            handleRegisterUserError(errMsg)
        );

        socket.on("disconnect", () => {
            setIsSocketConnected(false);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        });

        socket.on("reconnect", () => {
            setIsSocketConnected(true);
        });

        return () => {
            clearInterval(intervalId);
            clearInterval(timeoutId);
            socket.off("connect");
            socket.off("pong");
            socket.off("registered-user");
            socket.off("register-user-error");
            socket.off("disconnect");
            socket.off("reconnect");

            socket.disconnect();
            socket.close();
        };
    }, []);

    useEffect(() => {
        if (isSocketConnected) registerUser();
    }, [userDetails.id, isSocketConnected]);
};

export default useSocket;
