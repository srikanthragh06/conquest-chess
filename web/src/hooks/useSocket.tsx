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

const useSocket = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setUserDetails = useSetRecoilState(userDetailsState);
    const setIsRegistered = useSetRecoilState(isRegisteredState);
    const setIsRegistering = useSetRecoilState(isRegisteringState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);

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
        socket.on("connect", () => {
            setIsSocketConnected(true);
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
        });

        socket.on("reconnect", () => {
            setIsSocketConnected(true);
        });

        setIsRegistering(true);
        socket.connect();

        return () => {
            socket.off("connect");
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
