import { useNavigate } from "react-router-dom";
import navbarLogo from "../../public/navbarLogo.png";

const TitleBar = () => {
    const navigate = useNavigate();

    return (
        <div
            className="w-full flex justify-between pt-
                        border-"
        >
            <div
                className="flex w-full
                            border- items- justify-between"
            >
                <div className="w-full flex justify-center">
                    <img
                        src={navbarLogo}
                        className="max-w-[250px] w-[175px] sm:w-[225px] md:w-[275px] lg:w-[325px]
                                     cursor-pointer mt-[1px]"
                        onClick={() => navigate("/")}
                    />
                </div>
            </div>
            {/* <div
                className="flex md:space-x-8 space-x-3 justify-evenly
                            w-auto sm:w-auto
                            lg:text-xl md:text-lg text-base border-"
            >
                <button
                    className=" bg-gray-700 border- 
                                lg:px-4  px-3 py-1
                                rounded-md 
                                lg:text-lg md:text-base text-sm
                                hover:opacity-50 active:opacity-30 transition"
                    onClick={() => {
                        handleCreateLobby();
                    }}
                >
                    Create Lobby
                </button>
                <button
                    className=" bg-gray-700 border- 
                                lg:px-4 px-3 py-1
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
            </div> */}
        </div>
    );
};

export default TitleBar;
