import { FormEvent, useState } from "react";
import { isValidEmail } from "../utils/utils";
import { loginWithEmailApi, loginWithUsernameApi } from "../api/auth";
import { AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { isLoggedInState } from "../store/auth";
import { setAuthToken } from "../utils/token";

const useLogin = () => {
    const navigate = useNavigate();

    const setIsLoggedIn = useSetRecoilState(isLoggedInState);

    const [usermail, setUsermail] = useState("");
    const [password, setPassword] = useState("");

    const [loginError, setLoginError] = useState("");

    const [isLoginLoading, setIsLoginLoading] = useState(false);

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
                    // setUserDetails(res.data.user);
                    setIsLoggedIn(true);
                    setAuthToken(res.data.jwtToken);

                    setLoginError("");

                    navigate("/");
                } else {
                    setIsLoggedIn(false);
                    setLoginError(res?.data?.error || "Error");
                }
            } else {
                setIsLoggedIn(false);
                setLoginError("No response from server.");
            }
        } catch (error) {
            console.error(error);
            setLoginError("An error occurred during signin.");
            setIsLoggedIn(false);
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
