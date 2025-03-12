import MainPage from "@/components/MainPage";
import { Avatar } from "@/components/ui/avatar";
import useUserProfile from "@/hooks/useUserProfile";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import GameCard from "./GameCard";
import { Loader } from "lucide-react";

const UserPage = () => {
    const { userProfile, isUserProfileLoading, games, isGamesLoading } =
        useUserProfile();

    return (
        <MainPage hasNavbar={true} className="items-center">
            {isUserProfileLoading && (
                <Skeleton className="h-[100px] rounded-full bg-zinc-800 w-[350px] mt-4" />
            )}
            {userProfile && (
                <div
                    className="px-4 py-3 sm:px-6 sm:py-4 flex rounded-lg border-2 border-zinc-800 shadow-md 
                        shadow-zinc-800 sm:mt-8 mt-4 sm:space-x-8 space-x-5"
                >
                    <Avatar
                        className="w-[75px] h-[75px]
                                sm:w-[100px] sm:h-[100px]
                                text-sm"
                    >
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center justify-around ">
                        <div className="text-base sm:text-lg font-bold">
                            {userProfile.username}
                        </div>
                        <div className="flex justify-evenly space-x-4">
                            <div className="flex flex-col items-center">
                                <p className="sm:text-sm text-xs text-zinc-400">
                                    Games
                                </p>
                                <p className="sm:text-lg text-base font-bold">
                                    {userProfile.games}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="sm:text-sm text-xs text-zinc-400">
                                    Wins
                                </p>
                                <p className="sm:text-lg text-base font-bold">
                                    {userProfile.wins}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="sm:text-sm text-xs text-zinc-400">
                                    Losses
                                </p>
                                <p className="sm:text-lg text-base font-bold">
                                    {userProfile.losses}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="sm:text-sm text-xs text-zinc-400">
                                    Draws
                                </p>
                                <p className="sm:text-lg text-base font-bold">
                                    {userProfile.draws}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <h1 className="sm:text-lg sm:my-10 text-base my-5 font-bold">
                Games
            </h1>
            {isGamesLoading && <Loader />}
            {games &&
                (games.length === 0 ? (
                    <p className="text-sm text-zinc-400">No games played</p>
                ) : (
                    <div className="flex flex-col space-y-2">
                        {games.map((game, index) => {
                            return <GameCard key={index} game={game} />;
                        })}
                    </div>
                ))}
        </MainPage>
    );
};

export default UserPage;
