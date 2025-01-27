import FormInput from "../../components/FormInput";
import FormButton from "../../components/FormButton";
import useLogin from "../../hooks/useLogin";
import FormError from "../../components/FormError";

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
            <div className="border-2 w-36 h-36">Logo</div>

            <form
                className="w-full border-red-600
                                flex flex-col items-center space-y-4"
            >
                <div className="w-full flex flex-col items-center space-y-2 ">
                    <FormInput
                        inputState={usermail}
                        setInputState={setUsermail}
                        placeholder="Username or Email Address"
                        className="sm:w-3/4 w-5/6"
                    />
                    <FormInput
                        inputState={password}
                        setInputState={setPassword}
                        placeholder="Password"
                        type="password"
                        className="sm:w-3/4 w-5/6"
                    />
                </div>
                <FormError>{loginError}</FormError>
                <FormButton
                    isLoading={isLoginLoading}
                    onClick={(e) => handleLogin(e)}
                    className=" bg-gray-700 sm:w-3/4 w-5/6"
                >
                    Log in
                </FormButton>
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
