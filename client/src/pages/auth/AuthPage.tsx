import { useState } from "react";
import MainPage from "../../components/MainPage";
import Signup from "./Signup";
import Login from "./Login";

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <MainPage
            hasNavbar={false}
            authRequired={false}
            noAuthRequired={true}
            className="items-center justify-center"
        >
            {isLogin ? (
                <Login setIsLogin={setIsLogin} />
            ) : (
                <Signup setIsLogin={setIsLogin} />
            )}
        </MainPage>
    );
};

export default AuthPage;
