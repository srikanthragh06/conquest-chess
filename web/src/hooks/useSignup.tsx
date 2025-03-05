import { FormEvent, useState } from "react";
import { signupApi } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userDetailsState } from "../store/auth";
import { setAuthToken } from "../utils/token";

const useSignup = () => {
    const navigate = useNavigate();

    const setUserDetails = useSetRecoilState(userDetailsState);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [signupError, setSignupError] = useState("");

    const [isSignupLoading, setIsSignupLoading] = useState(false);

    const resetAuthState = () => {
        setUserDetails({ id: null, isGuest: false });
    };

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setIsSignupLoading(true);

        if (!password) {
            setSignupError("Password Field is missing!");
            setIsSignupLoading(false);
            return;
        }
        if (!confirmPassword) {
            setSignupError("Please confirm your password!");
            setIsSignupLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setSignupError("Password does not match confirm password");
            setIsSignupLoading(false);
            return;
        }

        try {
            const res = await signupApi(email, username, password);

            if (res) {
                if (!res.data?.error) {
                    setUserDetails({
                        id: res.data.user.username,
                        isGuest: false,
                    });
                    setAuthToken(res.data.jwtToken);
                    setSignupError("");
                    navigate("/");
                } else {
                    resetAuthState();
                    setSignupError(res?.data?.error || "Error");
                }
            } else {
                resetAuthState();
                setSignupError("No response from server.");
            }
        } catch (error) {
            console.error(error);
            resetAuthState();
            setSignupError("An error occurred during signin.");
        } finally {
            setIsSignupLoading(false);
        }
    };

    return {
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        signupError,
        isSignupLoading,
        handleSignup,
    };
};

export default useSignup;
