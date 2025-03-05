import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@radix-ui/react-dialog";
import Loader from "./Loader";
import { useRecoilValue } from "recoil";
import { isRegisteringState, loadingTextState } from "@/store/page";

const LoadingPage = () => {
    const loadingText = useRecoilValue(loadingTextState);
    const isRegistering = useRecoilValue(isRegisteringState);

    return (
        <Dialog open={true}>
            <DialogContent>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
                <div className="w-screen h-screen flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-6">
                        <div className="text-base">
                            {isRegistering ? "Authorizing client" : loadingText}
                            ...
                        </div>
                        <Loader className="text-5xl font-bold" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoadingPage;
