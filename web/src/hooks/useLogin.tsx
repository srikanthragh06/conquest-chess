import { FormEvent, useState } from "react";
import { isValidEmail } from "../utils/utils";
import { loginWithEmailApi, loginWithUsernameApi } from "../api/auth";
import { AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userDetailsState } from "../store/auth";
import { setAuthToken } from "../utils/token";

const useLogin = () => {
    const navigate = useNavigate();

    const setUserDetails = useSetRecoilState(userDetailsState);

    const [usermail, setUsermail] = useState("");
    const [password, setPassword] = useState("");

    const [loginError, setLoginError] = useState("");

    const [isLoginLoading, setIsLoginLoading] = useState(false);

    // const resetAuthState = () => {
    //     setUserDetails({ id: null, isGuest: false });
    // };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoginLoading(true);

        const isEmail = isValidEmail(usermail);

        try {
            let res: AxiosResponse<any, any> | undefined;
            if (isEmail) res = await loginWithEmailApi(usermail, password);
            else res = await loginWithUsernameApi(usermail, password);

            if (res) {
                if (!res.data?.error) {
                    setUserDetails({
                        id: res.data.user.username,
                        isGuest: false,
                    });
                    setAuthToken(res.data.jwtToken);

                    setLoginError("");

                    navigate("/");
                } else {
                    setLoginError(res?.data?.error || "Error");
                }
            } else {
                setLoginError("No response from server.");
            }
        } catch (error) {
            console.error(error);
            setLoginError("An error occurred during signin.");
        } finally {
            setIsLoginLoading(false);
        }
    };

    return {
        usermail,
        setUsermail,
        password,
        setPassword,
        loginError,
        isLoginLoading,
        handleLogin,
    };
};

export default useLogin;
