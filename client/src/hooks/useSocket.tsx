import { useEffect } from "react";
import { socket } from "../socket/main";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isRegisteredState, userDetailsState } from "../store/auth";

const useSocket = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setIsRegistered = useSetRecoilState(isRegisteredState);

    useEffect(() => {
        if (userDetails.id) {
            socket.on("connect", () => {
                console.log(`Connected to server with socket ID ${socket.id}`);
                socket.emit("register-user", {
                    userId: userDetails.isGuest
                        ? "Guest_" + userDetails.id
                        : userDetails.id,
                });
            });

            socket.on("registered-user", () => {
                setIsRegistered(true);
            });

            socket.on("error", (msg: string) => {
                console.log("Socket error: ", msg);
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
