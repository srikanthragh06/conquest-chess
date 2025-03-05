import { atom } from "recoil";

export const isRegisteredState = atom({
    key: "isRegistered",
    default: false,
});

export const userDetailsState = atom<{
    id: string | null;
    isGuest: boolean;
}>({
    key: "userDetails",
    default: {
        id: null,
        isGuest: false,
    },
});
