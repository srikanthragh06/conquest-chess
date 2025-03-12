import { gameCardType } from "@/types/game";
import { FaCrown, FaHourglassEnd } from "react-icons/fa";
import { MdThumbsUpDown } from "react-icons/md";
import { VscThumbsdownFilled } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";

const GameCard = ({ game }: { game: gameCardType }) => {
    const navigate = useNavigate();

    const isCheckmateOrResignation =
        game.gameStatus === "checkmate" || game.gameStatus === "resignation";
    const isCheckmate = game.gameStatus === "checkmate";
    const isResignation = game.gameStatus === "resignation";
    const isTimeout = game.gameStatus === "timeout";

    const isDraw = [
        "stalemate",
        "threefold-repetition",
        "insufficient-material",
        "mutual-draw",
    ].includes(game.gameStatus);

    const hasUserWon = (userId: string) =>
        (userId === game.whiteId && game.winner === "w") ||
        (userId === game.blackId && game.winner === "b");

    const formattedDate = new Date(game.startTime).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    const PlayerInfo = ({ userId }: { userId: string }) => (
        <div className="flex items-center space-x-2">
            {isDraw && <MdThumbsUpDown className="text-base text-gray-500" />}
            {isTimeout && (
                <FaHourglassEnd
                    className={`text-lg ${
                        hasUserWon(userId) ? "text-green-600" : "text-red-600"
                    }`}
                />
            )}
            {isCheckmateOrResignation &&
                (hasUserWon(userId) ? (
                    <FaCrown className="text-lg text-green-500" />
                ) : (
                    <VscThumbsdownFilled className="text-lg text-red-600" />
                ))}
            <span className="text-xs sm:text-sm">{userId}</span>
            <span className="text-gray-400 text-xs sm:text-sm">
                {isCheckmate &&
                    `${hasUserWon(userId) ? "won" : "lost"} by checkmate`}
                {isResignation &&
                    `${hasUserWon(userId) ? "won" : "lost"} due to resignation`}
                {isTimeout &&
                    `${hasUserWon(userId) ? "won" : "lost"} by timeout`}
                {isDraw && `draw by ${game.gameStatus}`}
            </span>
        </div>
    );

    return (
        <div
            className="p-3 sm:p-4 rounded-lg border border-gray-700 shadow-lg bg-zinc-900 
                    text-white space-y-2
                    hover:opacity-85 active:opacity-70 cursor-pointer transition"
            onClick={() => navigate(`/game/${game.gameId}`)}
        >
            <div className="text-xs sm:text-sm">
                <span className="text-gray-400">Game ID:</span> {game.gameId}
            </div>
            <div className="text-xs sm:text-sm">
                <span className="text-gray-400">Start time:</span>{" "}
                {formattedDate}
            </div>
            <div className="text-xs sm:text-sm">
                <span className="text-gray-400">Type:</span> {game.type}
            </div>
            <div className="flex flex-col space-y-1 border-t border-gray-700 pt-2">
                <PlayerInfo userId={game.whiteId} />
                <PlayerInfo userId={game.blackId} />
            </div>
        </div>
    );
};

export default GameCard;
