import { AiOutlineLoading3Quarters } from "react-icons/ai";

const Loader = ({ className }: { className?: string }) => {
    return (
        <AiOutlineLoading3Quarters
            className={`text-color4 animate-spin ${className}`}
        />
    );
};

export default Loader;
