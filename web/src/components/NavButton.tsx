import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "./ui/button";

type NavButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    text: string;
    icon: ReactNode;
};

const NavButton = ({ text, icon, ...props }: NavButtonProps) => {
    return (
        <Button
            className="flex justify-start items-center space-x-2 hover:opacity-85 transition 
                 border-t-2 border-zinc-800 rounded-none
            w-full p-6"
            {...props}
        >
            {icon}
            <div>{text}</div>
        </Button>
    );
};

export default NavButton;
