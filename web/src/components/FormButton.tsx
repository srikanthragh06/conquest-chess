import React, { ReactNode } from "react";
import Loader from "./Loader";
type ClickHandler<T extends HTMLElement> = (
    event: React.MouseEvent<T, MouseEvent>
) => void;

const FormButton = ({
    children,
    className,
    isLoading = false,
    isActive = true,
    onClick = () => {},
}: {
    children?: ReactNode;
    className?: string;
    isLoading?: boolean;
    isActive?: boolean;
    onClick?: ClickHandler<HTMLButtonElement>;
}) => {
    return (
        <button
            onClick={isActive ? onClick : () => {}}
            className={`text-lg 
                        px-2 py-1 rounded-md 
                        ${
                            isActive
                                ? "cursor-pointer hover:opacity-50 active:opacity-30 transition"
                                : "cursor-auto opacity-30"
                        } 
                        flex justify-center items-center
                        ${className}`}
        >
            {isLoading ? <Loader className="text-lg my-1" /> : children}
        </button>
    );
};

export default FormButton;
