import { useNavigate } from "react-router-dom";
import navbarLogo from "../../public/navbarLogo.png";
import PingMeter from "./PingMeter";

const TitleBar = () => {
    const navigate = useNavigate();

    return (
        <div
            className="w-full flex justify-between pt- items-center
                        border-"
        >
            <div className="flex w-full items-start justify-between py-1">
                <div className="w-full flex justify-center">
                    <img
                        src={navbarLogo}
                        className="max-w-[250px] w-[175px] sm:w-[225px] md:w-[275px] lg:w-[325px]
                                     cursor-pointer mt-[1px]"
                        onClick={() => navigate("/")}
                    />
                </div>
                <PingMeter className="absolute top-0 right-0" />
            </div>
        </div>
    );
};

export default TitleBar;
