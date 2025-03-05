import MainPage from "../../components/MainPage";
import FormButton from "../../components/FormButton";
import { useRecoilValue } from "recoil";
import { userDetailsState } from "../../store/auth";
import useLobby from "../../hooks/useLobby";
import FormError from "../../components/FormError";

const LobbyPage = () => {
    const userDetails = useRecoilValue(userDetailsState);

    const {
        lobbyDetails,
        handleStartGame,
        startGameError,
        handleMatchTypeSelect,
    } = useLobby();

    return (
        <MainPage
            hasNavbar={true}
            registeredRequired={true}
            className="items-center"
        >
            {lobbyDetails && (
                <>
                    <p className="mt-10 sm:text-xl text-lg">
                        <>
                            <span>Playing as</span>{" "}
                            {userDetails.isGuest ? (
                                <>
                                    <span className="font-bold">Guest_</span>
                                    {userDetails.id?.slice(6) || ""}
                                </>
                            ) : (
                                <span className="font-bold">
                                    {userDetails.id || ""}
                                </span>
                            )}
                        </>
                    </p>
                    <p className="sm:text-xl text-lg mt-3">
                        Lobby ID: {lobbyDetails ? lobbyDetails.lobbyId : ""}
                    </p>
                    <p className="sm:text-xl text-lg mt-8 text-center font-semibold">
                        Players
                    </p>
                    <div className="sm:w-96 w-5/6 mt- rounded-lg p-4 bg-gray-00 shadow-md">
                        <ul className="space-y-3">
                            {lobbyDetails?.players.map((userId, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center p-2 rounded-lg bg-gray-700 shadow-sm hover:shadow-md transition duration-200"
                                >
                                    <span className="sm:text-base text-sm font-bold text-center w-full ">
                                        {userId}{" "}
                                        {userId === lobbyDetails.hostId &&
                                            "(HOST)"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex sm:w-96 w-5/6 space-x-2 mt-3 justify-evenly">
                        {["Rapid", "Blitz", "Bullet"].map((type) => {
                            return (
                                <label
                                    key={type}
                                    className={`text-base px-2 py-1 rounded-lg transition 
                                                bg-gray-700 ${
                                                    lobbyDetails.hostId ===
                                                        userDetails.id &&
                                                    "cursor-pointer"
                                                }
                                    ${
                                        lobbyDetails?.matchType === type
                                            ? " hover:opacity-80 active:opacity-60"
                                            : "opacity-30"
                                    }
                                  `}
                                    onClick={() =>
                                        handleMatchTypeSelect(
                                            type as "Blitz" | "Rapid" | "Bullet"
                                        )
                                    }
                                >
                                    {type}{" "}
                                    {type === "Rapid"
                                        ? " (10 min)"
                                        : type === "Blitz"
                                        ? " (3 min)"
                                        : " (60 sec)"}
                                </label>
                            );
                        })}
                    </div>
                    <div className="mt-6 w-full flex flex-col items-center space-y-1">
                        <FormError>{startGameError}</FormError>
                        <FormButton
                            className="bg-gray-700 mt-8 px-10 py-1"
                            isActive={
                                lobbyDetails
                                    ? lobbyDetails.players.length === 2 &&
                                      lobbyDetails.hostId === userDetails.id
                                    : false
                            }
                            onClick={(e) => handleStartGame(e)}
                        >
                            Start Game!
                        </FormButton>
                    </div>
                </>
            )}
        </MainPage>
    );
};

export default LobbyPage;
