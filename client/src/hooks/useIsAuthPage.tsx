import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isLoggedInState } from "../store/auth";
import { getAuthToken } from "../utils/token";
import { isAuthApi } from "../api/auth";

const useIsAuthPage = (authRequired: boolean, noAuthRequired: boolean) => {
    const navigate = useNavigate();
    const isLoggedIn = useRecoilValue(isLoggedInState);
    const setIsLoggedIn = useSetRecoilState(isLoggedInState);

    const handleIsAuth = async () => {
        const token = getAuthToken();
        if (!token) {
            setIsLoggedIn(false);
            return false;
        }

        try {
            const res = await isAuthApi(token);
            if (res) {
                if (!res.data?.error) {
                    setIsLoggedIn(true);
                    return true;
                } else {
                    setIsLoggedIn(false);
                    return false;
                }
            } else {
                setIsLoggedIn(false);
                return false;
            }
        } catch (err) {
            console.error(err);
            setIsLoggedIn(false);
            return false;
        }
    };

    useEffect(() => {
        handleIsAuth();
    }, [navigate]);

    useEffect(() => {
        if (authRequired) {
            if (!isLoggedIn) navigate("/auth");
        }
        if (noAuthRequired) {
            if (isLoggedIn) navigate("/");
        }
    }, [isLoggedIn]);
};

export default useIsAuthPage;
