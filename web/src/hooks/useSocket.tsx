import { useEffect } from "react";
import { socket } from "../socket/main";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isRegisteredState, userDetailsState } from "../store/auth";
import { getAuthToken } from "../utils/token";

const useSocket = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setIsRegistered = useSetRecoilState(isRegisteredState);

    useEffect(() => {
        if (userDetails.id) {
            socket.on("connect", () => {
                const authToken = getAuthToken();

                socket.emit("register-user", { authToken });
            });

            socket.on("registered-user", () => {
                setIsRegistered(true);
            });

            socket.on("error", (msg: string) => {
                console.log("Socket error: ", msg);
            });

            socket.on("disconnect", () => {
                setIsRegistered(false);
            });

            socket.on("reconnect", () => {
                const authToken = getAuthToken();
                socket.emit("register-user", { authToken });
            });

            socket.connect();
        }

        return () => {
            socket.disconnect();
            socket.close();
        };
    }, [userDetails.id]);
};

export default useSocket;
