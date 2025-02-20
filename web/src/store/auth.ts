import { atom } from "recoil";

export const isLoggedInState = atom({
    key: "isLoggedIn",
    default: false,
});

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
