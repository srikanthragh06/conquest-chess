import FormInput from "../../components/FormInput";
import FormButton from "../../components/FormButton";
import FormError from "../../components/FormError";
import useJoinLobby from "../../hooks/useJoinLobby";

const JoinLobby = () => {
    const { joinLobbyId, setJoinLobbyId, joinLobbyError, handleJoinLobby } =
        useJoinLobby();
    return (
        <form
            className="border- 
                        flex flex-col space-y-2 items-center mt-10"
        >
            <FormInput
                type="text"
                placeholder="lobby ID"
                className="text-base"
                inputState={joinLobbyId}
                setInputState={setJoinLobbyId}
            />
            {joinLobbyError && <FormError>{joinLobbyError}</FormError>}
            <FormButton
                onClick={(e) => handleJoinLobby(e)}
                isActive={joinLobbyId.length > 0}
                className="bg-gray-700"
            >
                Join Lobby
            </FormButton>
        </form>
    );
};

export default JoinLobby;
