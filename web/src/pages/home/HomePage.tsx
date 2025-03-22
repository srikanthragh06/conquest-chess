import { useNavigate } from "react-router-dom";
import MainPage from "../../components/MainPage";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userDetailsState } from "@/store/auth";
import useFetchOngoingGame from "@/hooks/useFetchOngoingGame";
import { openQueueMatchState } from "@/store/page";
import useCreateLobby from "@/hooks/useCreateLobby";

const HomePage = () => {
    const navigate = useNavigate();
    const userDetails = useRecoilValue(userDetailsState);
    const { ongoingGameId } = useFetchOngoingGame();
    const setOpenQueueMatch = useSetRecoilState(openQueueMatchState);
    const { handleCreateLobby } = useCreateLobby();

    return (
        <MainPage
            hasNavbar={true}
            className="items-center overflow-y-hidden text-center"
        >
            <h1 className="sm:text-4xl text-2xl font-bold mt-16 shadow-sm">
                Master Every Move, Conquer Every Game
            </h1>
            {ongoingGameId && (
                <div className="mt-8 bg-zinc-950 px-6 py-4 rounded-lg border-2 border-zinc-700 shadow-md max-w-lg mx-auto">
                    <h2 className="text-lg sm:text-xl font-semibold">
                        Resume Your Game
                    </h2>
                    <p className="text-sm sm:text-base mt-2 text-zinc-400">
                        You have an ongoing game. Jump back in and continue
                        playing!
                    </p>
                    <button
                        className="mt-2 bg-zinc-900 border-2 border-zinc-700 px-4 py-2 
            text-lg sm:text-xl rounded-lg shadow-md hover:opacity-80 active:opacity-60 active:shadow-none active:border-zinc-800"
                        onClick={() => navigate(`/game/${ongoingGameId}`)}
                    >
                        Resume Game
                    </button>
                </div>
            )}

            {userDetails.isGuest && (
                <div className="mt-16 bg-zinc-950 px-8 py-6 rounded-lg border-2 border-zinc-700 shadow-md max-w-lg mx-auto">
                    <h2 className="text-lg sm:text-xl font-semibold">
                        Join the Conquest Chess Community
                    </h2>
                    <p className="text-sm sm:text-base mt-2 text-zinc-400">
                        Sign up now view and analyse your previous games.
                    </p>
                    <button
                        className="mt-2 bg-zinc-900 border-2 border-zinc-700 px-4 py-2 
                    text-lg sm:text-xl rounded-lg shadow-md hover:opacity-80 active:opacity-60 active:shadow-none active:border-zinc-800"
                        onClick={() => navigate("/auth")}
                    >
                        Sign Up Now
                    </button>
                </div>
            )}

            <div className="flex sm:flex-row flex-col w-full items-center justify-around mt-16 space-y-8 sm:space-y-0">
                <div className="flex flex-col items-center space-y-3 bg-zinc-950 px-6 py-4 rounded-lg border-2 border-zinc-700 shadow-md">
                    <h2 className="sm:text-lg text-base font-semibold">
                        Challenge Players Worldwide
                    </h2>
                    <button
                        className="bg-zinc-900 border-2 border-zinc-700 px-4 py-2 text-sm sm:text-base rounded-lg shadow-md hover:opacity-80 active:opacity-60 active:shadow-none active:border-zinc-800"
                        onClick={() => setOpenQueueMatch(true)}
                    >
                        Queue Match
                    </button>
                </div>

                <div className="flex flex-col items-center space-y-3 bg-zinc-950 px-6 py-4 rounded-lg border-2 border-zinc-700 shadow-md">
                    <h2 className="sm:text-lg text-base font-semibold">
                        Create a Lobby and play with friends!
                    </h2>
                    <div className="flex w-full justify-evenly space-x-3">
                        <button
                            className="bg-zinc-900 border-2 border-zinc-700 px-4 py-2 text-sm sm:text-base rounded-lg shadow-md hover:opacity-80 active:opacity-60 active:shadow-none active:border-zinc-800"
                            onClick={() => handleCreateLobby()}
                        >
                            Create Lobby
                        </button>
                    </div>
                </div>
            </div>
        </MainPage>
    );
};

export default HomePage;
