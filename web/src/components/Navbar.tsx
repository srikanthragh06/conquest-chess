import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isLoggedInState, userDetailsState } from "@/store/auth";
import { useRecoilState, useRecoilValue } from "recoil";
import { FaChessKnight, FaRobot } from "react-icons/fa";
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

const Navbar = () => {
    const userDetails = useRecoilValue(userDetailsState);
    const [isLoggedIn, setIsLoggedIn] = useRecoilState(isLoggedInState);
    const navigate = useNavigate();

    const handleLogOut = () => {
        removeAuthToken();
        setIsLoggedIn(false);
        navigate("/");
    };
    const { handleCreateLobby } = useCreateLobby();

    return (
        <div
            className="flex flex-col h-screen border- bg-zinc-900 w-[300px] 
                        py- space-y-3"
        >
            <div className="flex flex-col">
                <div className="flex items-center justify-start space-x-5 border- px-4 py-4 relative">
                    <Avatar className="w-[30px] h-[30px] text-sm">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>
                            {userDetails.isGuest
                                ? "G"
                                : userDetails.id?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-sm">
                        {userDetails.isGuest && (
                            <span className="font-bold">Guest_</span>
                        )}
                        {userDetails.isGuest ? (
                            <span>{userDetails.id}</span>
                        ) : (
                            <span className="font-bold">{userDetails.id}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-col text-base items-center">
                <NavButton text="Queue match" icon={<FaChessKing />} />
                <NavButton text="Play AI" icon={<FaRobot />} />
                <NavButton
                    text="Create Lobby"
                    icon={<FaChess />}
                    onClick={() => {
                        handleCreateLobby();
                    }}
                />
                {/* <NavButton text="Join Lobby" icon={<FaChessBishop />} /> */}
                <NavButton text="Spectate Game" icon={<BiSolidChess />} />
                <NavButton text="Search Players" icon={<FaSearch />} />
                {isLoggedIn && (
                    <NavButton text="View Profile" icon={<CgProfile />} />
                )}
                {isLoggedIn && (
                    <NavButton
                        text="Account Settings"
                        icon={<IoIosSettings />}
                    />
                )}
                {!isLoggedIn && (
                    <NavButton
                        text="Log in"
                        icon={<FaChessKnight />}
                        onClick={() => navigate("/auth")}
                    />
                )}
                {!isLoggedIn && (
                    <NavButton
                        text="Sign up"
                        icon={<FaChessRook />}
                        onClick={() => navigate("/auth")}
                    />
                )}
                {isLoggedIn && (
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
