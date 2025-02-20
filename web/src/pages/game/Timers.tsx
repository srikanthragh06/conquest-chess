import { gameType, movesType } from "../../types/game";
import useTimers from "../../hooks/useTimers";

const Timers = ({ game, moves }: { game: gameType; moves: movesType }) => {
    const { whiteTimeRem, blackTimeRem } = useTimers(game, moves);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        let seconds = Math.round((ms % 60000) / 1000);

        if (seconds === 60) {
            seconds = 0;
            return `${minutes + 1}:00`;
        }

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex w-full border-2 justify-evenly">
            {whiteTimeRem && <div>{formatTime(whiteTimeRem)}</div>}
            {blackTimeRem && <div>{formatTime(blackTimeRem)}</div>}
        </div>
    );
};

export default Timers;
