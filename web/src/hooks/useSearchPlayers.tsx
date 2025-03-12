import { getUserApi } from "@/api/user";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
} from "@/store/page";
import { useState } from "react";
import { useSetRecoilState } from "recoil";

const useSearchPlayers = () => {
    const [searchString, setSearchString] = useState("");
    const [isSearchLoading, setIsSearchLoading] = useState(false);

    const setErrorDialog = useSetRecoilState(errorDialogState);
    const setErrorTitle = useSetRecoilState(errorTitleState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);

    const handleSearchPlayer = async () => {
        if (!searchString) return;

        try {
            setIsSearchLoading(true);
            const res = await getUserApi(searchString);
            if (res) {
                if (!res.data?.error) {
                } else {
                    setErrorDialog(res?.data?.error || "Error");
                    setErrorTitle("Search User Error");
                    setIsErrorDialog(true);
                }
            } else {
                setErrorDialog("Error");
                setErrorTitle("User Profile Error");
                setIsErrorDialog(true);
            }
        } catch (err) {
            console.error(err);
            setErrorDialog("Server error");
            setErrorTitle("User Profile Error");
            setIsErrorDialog(true);
        } finally {
            setIsSearchLoading(false);
        }
    };

    return {
        searchString,
        isSearchLoading,
        handleSearchPlayer,
        setSearchString,
    };
};

export default useSearchPlayers;
