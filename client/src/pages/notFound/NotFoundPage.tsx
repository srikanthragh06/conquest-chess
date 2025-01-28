import MainPage from "../../components/MainPage";

const NotFoundPage = () => {
    return (
        <MainPage
            hasNavbar={false}
            authRequired={false}
            noAuthRequired={false}
            registeredRequired={false}
            className="items-center justify-center"
        >
            <div className="sm:text-lg text-base text-center">
                Oops! The page you're looking for doesn't exist.
                <br />
                Maybe check the URL or head back to the homepage!
            </div>
        </MainPage>
    );
};

export default NotFoundPage;
