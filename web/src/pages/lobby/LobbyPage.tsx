import MainPage from "../../components/MainPage";
import FormButton from "../../components/FormButton";
import { useRecoilValue } from "recoil";
import { userDetailsState } from "../../store/auth";
import useLobby from "../../hooks/useLobby";
import FormError from "../../components/FormError";
import CopyButton from "@/components/CopyButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const LobbyPage = () => {
    const userDetails = useRecoilValue(userDetailsState);

    const {
        lobbyDetails,
        handleStartGame,
        startGameError,
        handleMatchTypeSelect,
        handleClickPlayer,
    } = useLobby();

    return (
        <MainPage
            hasNavbar={true}
            registeredRequired={true}
            className="items-center"
        >
            {lobbyDetails && (
                <div className="flex flex-col items-center mt-3 sm:mt-6 space-y-6">
                    {/* Lobby Link */}
                    <div className="text-center">
                        <p className="text-base md:text-lg">
                            Share the lobby link to invite a friend
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                            <a
                                className="text-sm text-zinc-500 cursor-auto"
                                href={window.location.href}
                            >
                                {window.location.href}
                            </a>
                            <CopyButton
                                text={window.location.href}
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="w-full flex flex-col items-center mt-4 sm:mt-8 space-y-3 sm:space-y-6">
                        <p className="text-base sm:text-lg font-semibold">
                            Participants
                        </p>
                        <div className="flex flex-col sm:flex-row justify-between sm:space-x-3 md:space-x-5 space-y-2 sm:space-y-0">
                            {[0, 1].map((index) => (
                                <div
                                    key={index}
                                    className={`text-sm font-bold p-1 sm:px-3 sm:py-2 rounded-lg cursor-default 
                            ${
                                lobbyDetails.participants[index]
                                    ? "bg-white text-black"
                                    : "bg-zinc-800 text-white text-opacity-50"
                            }`}
                                >
                                    {lobbyDetails.participants[index] ||
                                        "Not yet chosen"}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game Mode Selection */}
                    <div className="flex flex-col items-center mt-6 sm:mt-10">
                        <p className="font-semibold text-base sm:text-lg">
                            Mode
                        </p>
                        <div className="flex justify-evenly w-5/6 sm:w-96 space-x-2 mt-3">
                            {["Rapid", "Blitz", "Bullet"].map((type) => (
                                <label
                                    key={type}
                                    className={`text-sm px-2 py-1 rounded-lg transition 
                            ${
                                lobbyDetails.hostId === userDetails.id
                                    ? "cursor-pointer"
                                    : "cursor-default"
                            } 
                            ${
                                lobbyDetails.matchType === type
                                    ? "bg-white text-black font-bold hover:opacity-80 active:opacity-60"
                                    : "opacity-30"
                            }`}
                                    onClick={() =>
                                        handleMatchTypeSelect(
                                            type as "Blitz" | "Rapid" | "Bullet"
                                        )
                                    }
                                >
                                    {type}{" "}
                                    {type === "Rapid"
                                        ? "(10 min)"
                                        : type === "Blitz"
                                        ? "(3 min)"
                                        : "(60 sec)"}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Start Game Button */}
                    <div className="w-full flex flex-col items-center space-y-1">
                        <FormError>{startGameError}</FormError>
                        <FormButton
                            className="bg-zinc-800 mt-8 px-3 py-2 text-sm"
                            isActive={
                                lobbyDetails &&
                                lobbyDetails.participants[0] !== null &&
                                lobbyDetails.participants[1] !== null &&
                                lobbyDetails.hostId === userDetails.id
                            }
                            onClick={handleStartGame}
                        >
                            Start Game!
                        </FormButton>
                    </div>

                    {/* Players List */}
                    <div className="w-full flex flex-col items-center">
                        <p className="text-xs text-zinc-500">
                            (Only the host can set the participants and game
                            mode)
                        </p>
                        <p className="text-base sm:text-lg font-semibold mt-2">
                            Players ({lobbyDetails.players.length}/10)
                        </p>
                        <div className="w-5/6 sm:w-96 p-4 rounded-lg bg-gray-00 shadow-md">
                            <ScrollArea className="flex flex-col max-h-[250px] bg-zinc-950 rounded-md border border-zinc-800">
                                {lobbyDetails.players.map((userId, index) => (
                                    <div
                                        key={userId}
                                        className="w-full cursor-pointer"
                                        onClick={() =>
                                            handleClickPlayer(userId)
                                        }
                                    >
                                        <div
                                            className={`flex justify-between items-center p-2 hover:opacity-80 transition duration-200 
                                ${
                                    lobbyDetails.participants.includes(userId)
                                        ? "bg-white text-black"
                                        : "bg-zinc-900 text-white"
                                }`}
                                        >
                                            <span className="text-xs font-bold text-center w-full">
                                                {userId}{" "}
                                                {userId ===
                                                    lobbyDetails.hostId &&
                                                    "(HOST)"}
                                            </span>
                                        </div>
                                        {index !==
                                            lobbyDetails.players.length - 1 && (
                                            <Separator className="w-full" />
                                        )}
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Please select at least 2 participants to start the
                            match
                        </p>
                    </div>
                </div>
            )}
        </MainPage>
    );
};

export default LobbyPage;
