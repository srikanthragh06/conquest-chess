import { atom } from "recoil";

export const pingState = atom({
    key: "ping",
    default: 5000,
});
