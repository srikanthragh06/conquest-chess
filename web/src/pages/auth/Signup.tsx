import FormInput from "../../components/FormInput";
import FormButton from "../../components/FormButton";
import useSignup from "../../hooks/useSignup";
import FormError from "../../components/FormError";

const Signup = ({
    setIsLogin,
}: {
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const {
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
    } = useSignup();
    return (
        <div
            className="flex flex-col items-center  mt-[120px]
                sm:w-[500px] w-[85%] h- space-y-4 border-"
        >
            <img className="w-36 h-36" src="logo.png" />

            <form
                className="w-full border-red-600
                    flex flex-col items-center space-y-4"
            >
                <div className="w-full flex flex-col items-center space-y-2 ">
                    <FormInput
                        inputState={email}
                        setInputState={setEmail}
                        placeholder="Email Address"
                        className="sm:w-3/4 w-5/6"
                    />
                    <FormInput
                        inputState={username}
                        setInputState={setUsername}
                        placeholder="Username"
                        className="sm:w-3/4 w-5/6"
                    />
                    <FormInput
                        inputState={password}
                        setInputState={setPassword}
                        placeholder="Password"
                        type="password"
                        className="sm:w-3/4 w-5/6"
                    />
                    <FormInput
                        inputState={confirmPassword}
                        setInputState={setConfirmPassword}
                        placeholder="Confirm Password"
                        type="password"
                        className="sm:w-3/4 w-5/6"
                    />
                </div>
                <FormError>{signupError}</FormError>
                <FormButton
                    onClick={(e) => handleSignup(e)}
                    isLoading={isSignupLoading}
                    className=" bg-gray-700 sm:w-3/4 w-5/6"
                >
                    Register
                </FormButton>
            </form>
            <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <span
                    onClick={() => setIsLogin(true)}
                    className="cursor-pointer hover:opacity-85 transition"
                >
                    Log in!
                </span>
            </p>
        </div>
    );
};

export default Signup;
