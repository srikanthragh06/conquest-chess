import {
    createBrowserRouter,
    RouteObject,
    RouterProvider,
} from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import NotFoundPage from "./pages/notFound/NotFoundPage";
import AuthPage from "./pages/auth/AuthPage";

function App() {
    const appRouter: RouteObject[] = [
        { path: "/", element: <HomePage /> },
        { path: "/auth", element: <AuthPage /> },
        { path: "/*", element: <NotFoundPage /> },
    ];

    return (
        <div
            className="w-screen h-screen
                        flex flex-col items-center
                        text-3xl  bg-gray-950 text-white"
        >
            <RouterProvider router={createBrowserRouter(appRouter)} />
        </div>
    );
}

export default App;
