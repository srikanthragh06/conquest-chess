import { getUserApi, userGamesApi } from "@/api/user";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
} from "@/store/page";
import { gameCardType, gameType } from "@/types/game";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";

const useUserProfile = () => {
    const { username } = useParams();

    const [userProfile, setUserProfile] = useState<{
        username: string;
        email: string;
        createdAt: number;
        lastActive: number;
        games: number;
        wins: number;
        losses: number;
        draws: number;
    } | null>(null);
    const [games, setGames] = useState<gameCardType[] | null>(null);

    const [isUserProfileLoading, setIsUserProfileLoading] = useState(false);
    const [isGamesLoading, setIsGamesLoading] = useState(false);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);
    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);

    const handleGetUserProfile = async () => {
        if (!username) return;

        try {
            setIsUserProfileLoading(true);
            const res = await getUserApi(username);
            if (res) {
                if (!res.data?.error) {
                    setUserProfile({
                        username: res.data.user.username,
                        email: res.data.user.email,
                        createdAt: new Date(res.data.user.createdAt).getTime(),
                        lastActive: new Date(
                            res.data.user.lastActive
                        ).getTime(),
                        games: res.data.user.games,
                        wins: res.data.user.wins,
                        losses: res.data.user.losses,
                        draws: res.data.user.draws,
                    });
                } else {
                    setUserProfile(null);
                    setErrorDialog(res?.data?.error || "Error");
                    setErrorTitle("User Profile Error");
                    setIsErrorDialog(true);
                }
            } else {
                setUserProfile(null);
                setErrorDialog("Error");
                setErrorTitle("User Profile Error");
                setIsErrorDialog(true);
            }
        } catch (err) {
            console.error(err);
            setUserProfile(null);
            setErrorDialog("Server error");
            setErrorTitle("User Profile Error");
            setIsErrorDialog(true);
        } finally {
            setIsUserProfileLoading(false);
        }
    };

    const handleGetUserGames = async () => {
        if (!username) return;

        try {
            setIsGamesLoading(true);
            const res = await userGamesApi(username);
            if (res) {
                if (!res.data?.error) {
                    setGames(
                        res.data.games.map((game: gameType) => {
                            return {
                                ...game,
                                startTime: new Date(game.startTime).getTime(),
                            };
                        })
                    );
                } else {
                    setGames(null);
                    setErrorDialog(res?.data?.error || "Error");
                    setErrorTitle("User games Error");
                    setIsErrorDialog(true);
                }
            } else {
                setGames(null);
                setErrorDialog("Error");
                setErrorTitle("User games Error");
                setIsErrorDialog(true);
            }
        } catch (err) {
            console.error(err);
            setGames(null);
            setErrorDialog("Server error");
            setErrorTitle("User games Error");
            setIsErrorDialog(true);
        } finally {
            setIsGamesLoading(false);
        }
    };

    useEffect(() => {
        handleGetUserProfile();
        handleGetUserGames();
    }, []);

    return {
        userProfile,
        isUserProfileLoading,
        games,
        isGamesLoading,
    };
};

export default useUserProfile;
