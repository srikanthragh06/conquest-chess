import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isLoggedInState, userDetailsState } from "../store/auth";
import { getAuthToken, setAuthToken } from "../utils/token";
import { createGuestApi, isAuthApi } from "../api/auth";

const useIsAuthPage = (authRequired: boolean, noAuthRequired: boolean) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = useRecoilValue(isLoggedInState);
    const setIsLoggedIn = useSetRecoilState(isLoggedInState);
    const setUserDetails = useSetRecoilState(userDetailsState);

    const resetAuthState = () => {
        setIsLoggedIn(false);
        setUserDetails({
            id: null,
            isGuest: false,
        });
    };

    const handleIsAuth = async () => {
        const token = getAuthToken();
        if (!token) {
            resetAuthState();
            handleCreateGuest();
            return false;
        }

        try {
            const res = await isAuthApi(token);
            if (res?.data) {
                if (!res.data?.error) {
                    if (res.data.user.isGuest)
                        setUserDetails({
                            id: res.data.user.guestId,
                            isGuest: true,
                        });
                    else
                        setUserDetails({
                            id: res.data.user.username,
                            isGuest: false,
                        });
                    setIsLoggedIn(!res.data.user?.isGuest);
                    return true;
                } else {
                    resetAuthState();
                    handleCreateGuest();
                    return false;
                }
            } else {
                resetAuthState();
                handleCreateGuest();
                return false;
            }
        } catch (err) {
            console.error(err);
            resetAuthState();
            handleCreateGuest();
            return false;
        }
    };

    const handleCreateGuest = async () => {
        try {
            const res = await createGuestApi();
            if (res?.data) {
                if (!res.data?.error) {
                    setUserDetails({
                        id: res.data.user.guestId,
                        isGuest: true,
                    });
                    setAuthToken(res.data.jwtToken);
                } else {
                    resetAuthState();
                }
            } else {
                resetAuthState();
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        handleIsAuth();
    }, [location.pathname, isLoggedIn]);

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
