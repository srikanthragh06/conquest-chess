import MainPage from "../../components/MainPage";
import ChessGame from "./ChessGame";

const GamePage = () => {
    return (
        <MainPage
            hasNavbar={true}
            registeredRequired={false}
            className="items-center"
        >
            <ChessGame />
        </MainPage>
    );
};

export default GamePage;
