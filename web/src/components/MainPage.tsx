import { ReactNode } from "react";
import TitleBar from "./TitleBar";
import { useRecoilValue, useSetRecoilState } from "recoil";
import Navbar from "./Navbar";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
    DrawerTrigger,
} from "./ui/drawer";
import { FiAlignJustify } from "react-icons/fi";
import LoadingPage from "./LoadingPage";
import {
    errorDialogState,
    errorTitleState,
    isErrorDialogState,
    isLoadingPageState,
    isRegisteringState,
} from "../store/page";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "../components/ui/dialog";

type MainPageProps = {
    children?: ReactNode;
    className?: string;
    hasNavbar: boolean;
    registeredRequired: boolean;
};

const MainPage = ({ children, className = "", hasNavbar }: MainPageProps) => {
    const isLoadingPage = useRecoilValue(isLoadingPageState);
    const isRegistering = useRecoilValue(isRegisteringState);
    const isErrorDialog = useRecoilValue(isErrorDialogState);
    const setIsErrorDialog = useSetRecoilState(isErrorDialogState);
    const errorDialog = useRecoilValue(errorDialogState);
    const errorTitle = useRecoilValue(errorTitleState);

    if (isLoadingPage || isRegistering) return <LoadingPage />;
    return (
        <div
            className={`w-full h-full 
                        flex flex-`}
        >
            <div className="lg:hidden">
                {hasNavbar && (
                    <Drawer direction="left">
                        <DrawerTrigger>
                            <FiAlignJustify
                                className="text-3xl sm:text-4xl md:text-5xl mt-1
                                                "
                            />
                        </DrawerTrigger>
                        <DrawerContent className=" bg-zinc-900 border-none text-white shadow-lg w-[250px]">
                            <DrawerTitle></DrawerTitle>
                            <DrawerDescription></DrawerDescription>
                            <Navbar />
                        </DrawerContent>
                    </Drawer>
                )}
            </div>
            <div className="hidden lg:block">{hasNavbar && <Navbar />}</div>
            <div
                className={`w-full h-full 
                        flex flex-col
                        overflow-x-hidden
                        ${className}`}
            >
                {hasNavbar && <TitleBar />}
                {children}
                <Dialog
                    open={isErrorDialog}
                    onOpenChange={() => setIsErrorDialog(false)}
                >
                    <DialogContent className="bg-zinc-800 text-white border-none">
                        <DialogTitle>{errorTitle}</DialogTitle>
                        <DialogDescription>{errorDialog}</DialogDescription>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default MainPage;
