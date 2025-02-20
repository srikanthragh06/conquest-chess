import { ReactNode } from "react";
import Navbar from "./Navbar";
import useIsAuthPage from "../hooks/useIsAuthPage";
import { useRecoilValue } from "recoil";
import { isRegisteredState } from "../store/auth";

type MainPageProps = {
    children?: ReactNode;
    className?: string;
    hasNavbar: boolean;
    registeredRequired: boolean;
    authRequired: boolean;
    noAuthRequired: boolean;
};

const MainPage = ({
    children,
    className = "",
    hasNavbar,
    registeredRequired,
    authRequired,
    noAuthRequired,
}: MainPageProps) => {
    const isRegisterd = useRecoilValue(isRegisteredState);

    useIsAuthPage(authRequired, noAuthRequired);

    return (
        <div
            className={`w-full h-full 
                        flex flex-col
                        overflow-x-hidden
                        ${className}`}
        >
            {hasNavbar && <Navbar />}
            {registeredRequired ? (
                isRegisterd ? (
                    children
                ) : (
                    <p className="text-4xl">Client not registered</p>
                )
            ) : (
                children
            )}
        </div>
    );
};

export default MainPage;
