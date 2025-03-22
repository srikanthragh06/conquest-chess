import { useRecoilState } from "recoil";
import {
    Dialog,
    DialogContent,
    DialogDescription,
} from "../components/ui/dialog";
import Loader from "./Loader";
import useQueueMatch from "@/hooks/useQueueMatch";
import { openQueueMatchState } from "@/store/page";

const QueueMatchDialog = () => {
    const [openQueueMatch, setOpenQueueMatch] =
        useRecoilState(openQueueMatchState);

    const { isQueueing, setIsQueueing, matchType, setMatchType } =
        useQueueMatch();

    return (
        <Dialog
            open={openQueueMatch}
            onOpenChange={() => setOpenQueueMatch(false)}
        >
            <DialogContent className="bg-zinc-900 text-white border-none">
                <DialogDescription className="w-full flex justify-around">
                    {isQueueing ? (
                        <div className="flex flex-col items-center w-full space-y-4">
                            <p className="text-lg">Searching for oppernent</p>
                            <Loader className="text-2xl" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full space-y-6">
                            <h1 className="text-lg">Choose Matchtype</h1>
                            <div className="flex justify-evenly w-5/6 sm:w-96 space-x-2 mt-3">
                                {["Rapid", "Blitz", "Bullet"].map((type) => (
                                    <label
                                        key={type}
                                        className={`text-sm px-3 py-2 rounded-lg cursor-pointer hover:opacity-85 transition
                            ${
                                matchType === type
                                    ? "bg-white text-black font-bold hover:opacity-80 active:opacity-60"
                                    : "bg-zinc-950 border-2 text-white shadow-sm border-zinc-700"
                            }`}
                                        onClick={() =>
                                            setMatchType(
                                                type as
                                                    | "Blitz"
                                                    | "Rapid"
                                                    | "Bullet"
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
                            <button
                                className="px-2 py-1 bg-zinc-950 shadow-sm border-zinc-700 
                            border-2 rounded-lg text-white hover:opacity-80 transition"
                                onClick={() =>
                                    setIsQueueing((isQueueing) =>
                                        isQueueing === false ? true : false
                                    )
                                }
                            >
                                Queue match
                            </button>
                        </div>
                    )}
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
};

export default QueueMatchDialog;
