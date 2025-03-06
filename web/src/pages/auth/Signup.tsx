import useSignup from "../../hooks/useSignup";
import FormError from "../../components/FormError";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "../../components/Loader";

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
                    <Input
                        type="email"
                        className="sm:w-3/4 w-5/6"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEmail(e.target.value)
                        }
                    />
                    <Input
                        type="text"
                        className="sm:w-3/4 w-5/6"
                        placeholder="Username"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUsername(e.target.value)
                        }
                    />
                    <Input
                        type="password"
                        className="sm:w-3/4 w-5/6"
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPassword(e.target.value)
                        }
                    />
                    <Input
                        type="password"
                        className="sm:w-3/4 w-5/6"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setConfirmPassword(e.target.value)
                        }
                    />
                </div>
                <FormError>{signupError}</FormError>
                <Button
                    onClick={(e) => handleSignup(e)}
                    className=" bg-zinc-800 sm:w-3/4 w-5/6"
                >
                    {isSignupLoading ? <Loader /> : "Sign up"}
                </Button>
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
