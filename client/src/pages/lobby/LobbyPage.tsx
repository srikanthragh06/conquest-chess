import MainPage from "../../components/MainPage";
import FormButton from "../../components/FormButton";
import { useRecoilValue } from "recoil";
import { isLoggedInState, userDetailsState } from "../../store/auth";
import useLobby from "../../hooks/useLobby";

const LobbyPage = () => {
    const isLoggedIn = useRecoilValue(isLoggedInState);
    const userDetails = useRecoilValue(userDetailsState);

    const { lobbyDetails, lobbyDetailsError } = useLobby();

    return (
        <MainPage
            hasNavbar={true}
            authRequired={false}
            noAuthRequired={false}
            registeredRequired={true}
            className="items-center"
        >
            {lobbyDetailsError && (
                <p className="sm:text-xl text-lg mt-20 text-red-400 text-center">
                    {lobbyDetailsError}
                </p>
            )}
            {lobbyDetails && (
                <>
                    <p className="mt-10 sm:text-xl text-lg">
                        <>
                            <span>Playing as</span>{" "}
                            {isLoggedIn ? (
                                <span className="font-bold">
                                    {userDetails.id || ""}
                                </span>
                            ) : (
                                <>
                                    <span className="font-bold">Guest</span>_
                                    {userDetails.id}
                                </>
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

                    <div className="sm:w-96 w-5/6 h-[200px] border-2 mt-10"></div>
                    <FormButton
                        className="bg-gray-700 mt-4 px-10 py-1"
                        isActive={false}
                    >
                        Start Game!
                    </FormButton>
                </>
            )}
        </MainPage>
    );
};

export default LobbyPage;
