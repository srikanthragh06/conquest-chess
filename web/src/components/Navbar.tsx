import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userDetailsState } from "@/store/auth";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { FaChessKnight } from "react-icons/fa";
import NavButton from "./NavButton";
import { FaChess } from "react-icons/fa";
import { FaChessKing } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { FaChessRook } from "react-icons/fa6";
import { removeAuthToken } from "@/utils/token";
import { useNavigate } from "react-router-dom";
import useCreateLobby from "@/hooks/useCreateLobby";
import { IoMdHome } from "react-icons/io";
import FormInput from "./FormInput";
import FormButton from "./FormButton";
import useSearchPlayers from "@/hooks/useSearchPlayers";
import { openQueueMatchState } from "@/store/page";

const Navbar = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setUserDetails = useSetRecoilState(userDetailsState);
    const setOpenQueueMatch = useSetRecoilState(openQueueMatchState);

    const navigate = useNavigate();

    const handleLogOut = () => {
        removeAuthToken();
        setUserDetails({ id: null, isGuest: false });
    };
    const { handleCreateLobby } = useCreateLobby();

    const {
        searchString,
        handleSearchPlayer,
        isSearchLoading,
        setSearchString,
    } = useSearchPlayers();

    return (
        <div
            className="flex flex-col h-screen bg-zinc-900 w-[300px] 
                        space-y-3 sticky top-0 bottom-0"
        >
            <div className="flex flex-col">
                <div className="flex items-center justify-start space-x-5 border- px-4 py-4">
                    {/* <Avatar className="w-[40px] h-[40px] text-sm">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>
                            {userDetails.isGuest
                                ? "G"
                                : userDetails.id?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar> */}

                    <div className="sm:text-xl text-lg">
                        <span className="font-bold">{userDetails.id}</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col text-base items-center">
                <div
                    className="w-full h-full py-2 px-10 flex flex-col items-center space-y-3
                    border-b- border-zinc-800"
                >
                    <FormInput
                        className="sm:text-sm text-xs text-white bg-zinc-950 w-full
                    border-2 border-zinc-600 focus:border-zinc-400 transition"
                        placeholder="Search Players"
                        inputState={searchString}
                        setInputState={setSearchString}
                    />
                    <FormButton
                        className="bg-zinc-950 px-3 py-1 text-xs border-2 
                                        border-zinc-800 shadow-sm w-[100px] mt-2"
                        onClick={() => handleSearchPlayer()}
                        isLoading={isSearchLoading}
                    >
                        Search
                    </FormButton>
                </div>

                <NavButton
                    text="Home"
                    icon={<IoMdHome />}
                    onClick={() => navigate("/")}
                />
                <NavButton
                    text="Queue match"
                    icon={<FaChessKing />}
                    onClick={() => setOpenQueueMatch(true)}
                />
                <NavButton
                    text="Create Lobby"
                    icon={<FaChess />}
                    onClick={() => {
                        handleCreateLobby();
                    }}
                />
                {userDetails.id && !userDetails.isGuest && (
                    <NavButton
                        text="View Profile"
                        icon={<CgProfile />}
                        onClick={() => navigate(`/user/${userDetails.id}`)}
                    />
                )}
                {userDetails.id && userDetails.isGuest && (
                    <NavButton
                        text="Log in"
                        icon={<FaChessKnight />}
                        onClick={() => navigate("/auth")}
                    />
                )}
                {userDetails.id && userDetails.isGuest && (
                    <NavButton
                        text="Sign up"
                        icon={<FaChessRook />}
                        onClick={() => navigate("/auth")}
                    />
                )}
                {userDetails.id && !userDetails.isGuest && (
                    <NavButton
                        onClick={handleLogOut}
                        text="Log out"
                        icon={<MdLogout />}
                    />
                )}
            </div>
        </div>
    );
};

export default Navbar;
