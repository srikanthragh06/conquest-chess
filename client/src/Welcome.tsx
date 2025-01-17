const Welcome = ({ handleJoinQueue }: { handleJoinQueue: () => void }) => {
    return (
        <button
            className="mt-5 p-2 bg-blue-300 hover:opacity-85 transition-all"
            onClick={handleJoinQueue}
        >
            Queue match!
        </button>
    );
};

export default Welcome;
