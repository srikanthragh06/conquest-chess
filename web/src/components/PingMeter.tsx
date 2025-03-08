import { pingState } from "@/store/connection";
import { TbAntennaBars5 } from "react-icons/tb";
import { useRecoilValue } from "recoil";

const PingMeter = ({ className = "" }: { className?: string }) => {
    const ping = useRecoilValue(pingState);

    return (
        <div
            className={`flex items-center px-2  ${
                ping < 150 ? "text-white" : "text-red-700"
            }  ${className}`}
        >
            <TbAntennaBars5 className="sm:text-2xl text-lg" />{" "}
            <span className="sm:text-sm text-xs">
                {ping >= 5000 ? ">5000" : ping}ms
            </span>
        </div>
    );
};

export default PingMeter;
