import {
    createBrowserRouter,
    RouteObject,
    RouterProvider,
} from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import NotFoundPage from "./pages/notFound/NotFoundPage";
import AuthPage from "./pages/auth/AuthPage";
import LobbyPage from "./pages/lobby/LobbyPage";
import useSocket from "./hooks/useSocket";
import GamePage from "./pages/game/GamePage";
import UserPage from "./pages/user/UserPage";

function App() {
    const appRouter: RouteObject[] = [
        { path: "/", element: <HomePage /> },
        { path: "/auth", element: <AuthPage /> },
        { path: "/lobby/:lobbyId", element: <LobbyPage /> },
        { path: "/game/:gameId", element: <GamePage /> },
        { path: "/user/:username", element: <UserPage /> },
        { path: "/*", element: <NotFoundPage /> },
    ];

    useSocket();

    return (
        <div
            className="w-full h-full min-h-screen
                        flex flex-col items-center
                        text-3xl bg-black text-white"
        >
            <RouterProvider router={createBrowserRouter(appRouter)} />
        </div>
    );
}

export default App;
