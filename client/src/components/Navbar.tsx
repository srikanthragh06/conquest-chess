import { FiAlignJustify } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { isLoggedInState } from "../store/auth";
import { removeAuthToken } from "../utils/token";

const Navbar = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useRecoilState(isLoggedInState);

    const handleLogOut = () => {
        removeAuthToken();
        setIsLoggedIn(false);
        navigate("/");
    };

    return (
        <div
            className="w-full flex justify-between items-center
                        lg:px-6 md:px-8 px-2
                        py-1
                        border-"
        >
            <div
                className="flex xl:space-x-96 lg:space-x-64 md:space-x-32 space-x-16
                            border-"
            >
                <FiAlignJustify className="lg:text-5xl md:text-4xl text-3xl cursor-pointer hover:opacity-85 transition" />
                <div className="cursor-pointer w-64 border-2 sm:block hidden"></div>
            </div>
            <div
                className="flex md:space-x-8 space-x-3 justify-evenly
                            w-auto sm:w-auto
                            lg:text-xl md:text-lg text-base border-"
            >
                <button
                    className=" bg-gray-700 border- 
                                lg:px-8 lg:py-2 md:px-6 md:py-2 px-4 py-1
                                rounded-md 
                                lg:text-lg md:text-base text-sm
                                hover:opacity-50 active:opacity-30 transition"
                    onClick={() => {
                        if (isLoggedIn) handleLogOut();
                        else navigate("/auth");
                    }}
                >
                    {isLoggedIn ? "Log out" : "Log in"}
                </button>
            </div>
        </div>
    );
};

export default Navbar;
