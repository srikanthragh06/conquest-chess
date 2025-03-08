import { pingState } from "@/store/connection";
import { TbAntennaBars5 } from "react-icons/tb";
import { useRecoilValue } from "recoil";

const PingMeter = ({ className = "" }: { className?: string }) => {
    const ping = useRecoilValue(pingState);

    return (
        <div
            className={`flex items-center px-2 ${
                ping > 150
                    ? "text-red-700"
                    : ping > 75
                    ? "text-yellow-300"
                    : "text-green-800"
            }  ${className}`}
        >
            <TbAntennaBars5 className="text-2xl" />{" "}
            <span className="text-sm">{ping >= 5000 ? ">5000" : ping}ms</span>
        </div>
    );
};

export default PingMeter;
