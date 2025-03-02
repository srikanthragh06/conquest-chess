import MainPage from "../../components/MainPage";

const HomePage = () => {
    return (
        <MainPage
            hasNavbar={true}
            authRequired={false}
            noAuthRequired={false}
            registeredRequired={false}
            className="items-center"
        ></MainPage>
    );
};

export default HomePage;
