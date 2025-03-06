import useLogin from "../../hooks/useLogin";
import FormError from "../../components/FormError";
import { Input } from "@/components/ui/input";
import React from "react";
import { Button } from "@/components/ui/button";
import Loader from "../../components/Loader";

const Login = ({
    setIsLogin,
}: {
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const {
        usermail,
        setUsermail,
        password,
        setPassword,
        loginError,
        isLoginLoading,
        handleLogin,
    } = useLogin();

    return (
        <div
            className="flex flex-col items-center mt-[120px]
                            sm:w-[500px] w-[85%] h- space-y-4 border-"
        >
            <img className="w-36 h-36" src="logo.png" />

            <form
                className="w-full border-red-600
                                flex flex-col items-center space-y-4"
            >
                <div className="w-full flex flex-col items-center space-y-2 ">
                    <Input
                        type="text"
                        className="sm:w-3/4 w-5/6"
                        placeholder="Username or Email Address"
                        value={usermail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUsermail(e.target.value)
                        }
                    />
                    <Input
                        type="password"
                        className="sm:w-3/4 w-5/6 "
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPassword(e.target.value)
                        }
                    />
                </div>
                <FormError>{loginError}</FormError>
                <Button
                    onClick={(e) => handleLogin(e)}
                    className=" bg-zinc-800 sm:w-3/4 w-5/6"
                >
                    {isLoginLoading ? <Loader /> : "Log in"}
                </Button>
            </form>
            <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <span
                    onClick={() => setIsLogin(false)}
                    className="cursor-pointer hover:opacity-85 transition"
                >
                    Sign up!
                </span>
            </p>
        </div>
    );
};

export default Login;
