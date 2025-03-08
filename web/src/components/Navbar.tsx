import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userDetailsState } from "@/store/auth";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { FaChessKnight } from "react-icons/fa";
import NavButton from "./NavButton";
import { FaChess } from "react-icons/fa";
import { BiSolidChess } from "react-icons/bi";
import { FaChessKing } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoIosSettings } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import { FaChessRook } from "react-icons/fa6";
import { removeAuthToken } from "@/utils/token";
import { useNavigate } from "react-router-dom";
import useCreateLobby from "@/hooks/useCreateLobby";
import { IoMdHome } from "react-icons/io";
import PingMeter from "./PingMeter";

const Navbar = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const setUserDetails = useSetRecoilState(userDetailsState);

    const navigate = useNavigate();

    const handleLogOut = () => {
        removeAuthToken();
        setUserDetails({ id: null, isGuest: false });
    };
    const { handleCreateLobby } = useCreateLobby();

    return (
        <div
            className="flex flex-col h-screen bg-zinc-900 w-[300px] 
                        space-y-3 sticky top-0 bottom-0"
        >
            <div className="flex flex-col">
                <div className="flex items-center justify-start space-x-5 border- px-4 py-4">
                    <Avatar className="w-[30px] h-[30px] text-sm">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>
                            {userDetails.isGuest
                                ? "G"
                                : userDetails.id?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-sm">
                        <span className="font-bold">{userDetails.id}</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col text-base items-center">
                <NavButton
                    text="Home"
                    icon={<IoMdHome />}
                    onClick={() => navigate("/")}
                />
                <NavButton text="Queue match" icon={<FaChessKing />} />
                <NavButton
                    text="Create Lobby"
                    icon={<FaChess />}
                    onClick={() => {
                        handleCreateLobby();
                    }}
                />
                <NavButton text="Spectate Game" icon={<BiSolidChess />} />
                <NavButton text="Search Players" icon={<FaSearch />} />
                {userDetails.id && !userDetails.isGuest && (
                    <NavButton text="View Profile" icon={<CgProfile />} />
                )}
                {userDetails.id && !userDetails.isGuest && (
                    <NavButton
                        text="Account Settings"
                        icon={<IoIosSettings />}
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
