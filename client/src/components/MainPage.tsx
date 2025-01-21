import { ReactNode } from "react";
import Navbar from "./Navbar";
import useIsAuthPage from "../hooks/useIsAuthPage";

type MainPageProps = {
    children?: ReactNode;
    className?: string;
    hasNavbar: boolean;
    authRequired: boolean;
    noAuthRequired: boolean;
};

const MainPage = ({
    children,
    className = "",
    hasNavbar,
    authRequired,
    noAuthRequired,
}: MainPageProps) => {
    useIsAuthPage(authRequired, noAuthRequired);

    return (
        <div
            className={`w-full h-full 
                        flex flex-col
                        overflow-x-hidden
                        ${className}`}
        >
            {hasNavbar && <Navbar />}
            {children}
        </div>
    );
};

export default MainPage;
