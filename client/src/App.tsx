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

function App() {
    const appRouter: RouteObject[] = [
        { path: "/", element: <HomePage /> },
        { path: "/auth", element: <AuthPage /> },
        { path: "/lobby/:lobbyId", element: <LobbyPage /> },
        { path: "/*", element: <NotFoundPage /> },
    ];

    useSocket();

    return (
        <div
            className="w-full h-full min-h-screen
                        overflow-y-auto
                        flex flex-col items-center
                        text-3xl  bg-gray-950 text-white"
        >
            <RouterProvider router={createBrowserRouter(appRouter)} />
        </div>
    );
}

export default App;
