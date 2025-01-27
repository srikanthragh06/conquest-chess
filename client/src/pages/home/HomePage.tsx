// import { useEffect, useState } from "react";
import MainPage from "../../components/MainPage";
import JoinLobby from "./JoinLobby";
// import { io, Socket } from "socket.io-client";
// import { Chess } from "chess.js";
// import Welcome from "./Welcome";
// import ChessGame from "./ChessGame";
// import ChessGame2 from "./ChessGame2";

const HomePage = () => {
    // const [socket, setSocket] = useState<Socket | null>(null);
    // const [game, setGame] = useState(new Chess());
    // const [isGameStarted, setIsGameStarted] = useState(false);
    // const [gameData, setGameData] = useState<{
    //     roomId: string;
    //     color: "white" | "black";
    // } | null>(null);
    // const handleJoinQueue = () => {
    //     if (socket) {
    //         socket.emit("join-queue");
    //     }
    // };

    // useEffect(() => {
    //     const newSocket = io("http://localhost:3000");
    //     newSocket.on("connect", () => {
    //         console.log(`Connected to server with ID: ${newSocket.id}`);
    //     });
    //     newSocket.on(
    //         "match-found",
    //         (data: { roomId: string; color: "white" | "black" }) => {
    //             setIsGameStarted(true);
    //             setGameData(data);
    //             setGame(new Chess()); // Reset game state when match is found
    //         }
    //     );
    //     newSocket.on(
    //         "game-update",
    //         ({ boardFen }: { boardFen: string; roomId: string }) => {
    //             setGame(new Chess(boardFen)); // Update game state with latest board FEN
    //         }
    //     );
    //     setSocket(newSocket);
    //     return () => {
    //         newSocket.disconnect();
    //     };
    // }, []);

    return (
        <MainPage
            hasNavbar={true}
            authRequired={false}
            noAuthRequired={false}
            registeredRequired={false}
            className="items-center"
        >
            {/* <div className="w-screen h-screen flex flex-col items-center bg-black">
                {isGameStarted && gameData ? (
                    <ChessGame2
                    // game={game}
                    // socket={socket}
                    // boardOrientation={gameData.color}
                    // roomId={gameData.roomId}
                    />
                ) : (
                    <Welcome handleJoinQueue={handleJoinQueue} />
                )}
                <ChessGame2 />
            </div> */}
            <JoinLobby></JoinLobby>
        </MainPage>
    );
};

export default HomePage;
