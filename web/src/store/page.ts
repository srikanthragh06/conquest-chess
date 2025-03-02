import { atom } from "recoil";

export const isLoadingPageState = atom({
    key: "isLoadingPage",
    default: false,
});

export const isRegisteringState = atom({
    key: "isRegistering",
    default: false,
});

export const loadingTextState = atom({
    key: "loadingText",
    default: "",
});

export const isErrorDialogState = atom({
    key: "isErrorDialog",
    default: false,
});
export const errorDialogState = atom({
    key: "errorDialog",
    default: "",
});
