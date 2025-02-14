import { useCallback, useEffect, useState } from "react";
import { socket } from "../socket/main";
import { gameType, movesType } from "../types/game";
import { Timer, useTimer } from "react-use-precision-timer";

const useTimers = (game: gameType, moves: movesType) => {
    const [whiteTimeRem, setWhiteTimeRem] = useState(1 * 60 * 1000);
    const [blackTimeRem, setBlackTimeRem] = useState(1 * 60 * 1000);

    const [isWhitePaused, setIsWhitePaused] = useState(
        game.gameStatus.status !== "playing" || moves.length % 2 === 1
    );
    const [isBlackPaused, setIsBlackPaused] = useState(
        game.gameStatus.status !== "playing" || moves.length % 2 === 0
    );

    const [periodicUpdateSwitch, setPeriodicUpdateSwitch] = useState(true);

    const delay = 1000;

    const updateTimer = (
        timeRem: number | null,
        setTimeRem: React.Dispatch<React.SetStateAction<number>>,
        timer: Timer
    ) => {
        if (timeRem === null) return;
        if (timeRem < delay) {
            timer.stop();
            setTimeRem(0);
        } else {
            setTimeRem((timeRem) => {
                if (timeRem) return timeRem - delay;
                else return timeRem;
            });
        }
    };

    const whiteCallback = useCallback(
        () => updateTimer(whiteTimeRem, setWhiteTimeRem, whiteTimer),
        []
    );
    const whiteTimer = useTimer({ delay }, whiteCallback);

    const blackCallback = useCallback(
        () => updateTimer(blackTimeRem, setBlackTimeRem, blackTimer),
        []
    );
    const blackTimer = useTimer({ delay }, blackCallback);

    useEffect(() => {
        if (!isWhitePaused && whiteTimeRem && whiteTimeRem > 0) {
            whiteTimer.start();
        } else {
            whiteTimer.pause();
        }
    }, [isWhitePaused]);

    useEffect(() => {
        if (!isBlackPaused && blackTimeRem && blackTimeRem > 0) {
            blackTimer.start();
        } else {
            blackTimer.pause();
        }
    }, [isBlackPaused]);

    useEffect(() => {
        setIsWhitePaused(
            game.gameStatus.status !== "playing" || moves.length % 2 === 1
        );
        setIsBlackPaused(
            game.gameStatus.status !== "playing" || moves.length % 2 === 0
        );

        if (
            game.gameStatus.status === "timeout" &&
            game.gameStatus.color === "b"
        )
            setWhiteTimeRem(0);

        if (
            game.gameStatus.status === "timeout" &&
            game.gameStatus.color === "w"
        )
            setBlackTimeRem(0);
    }, [game]);

    useEffect(() => {
        socket.emit("get-time", game.gameId);

        socket.on(
            "time-update",
            ({
                whiteTime,
                blackTime,
            }: {
                whiteTime: number;
                blackTime: number;
            }) => {
                setWhiteTimeRem(whiteTime);
                setBlackTimeRem(blackTime);
            }
        );

        return () => {
            socket.off("time-update");
        };
    }, [game]);

    useEffect(() => {
        if (game.gameStatus.status === "playing" && whiteTimeRem <= 0) {
            socket.emit("timeout", game.gameId);
        }
        if (game.gameStatus.status === "playing" && blackTimeRem <= 0) {
            socket.emit("timeout", game.gameId);
        }
    }, [whiteTimeRem, blackTimeRem, game]);

    useEffect(() => {
        if (whiteTimeRem !== null) {
            const seconds = Math.round(whiteTimeRem / 1000);

            if (seconds % 10 === 0 && periodicUpdateSwitch) {
                socket.emit("get-time", game.gameId);
                setPeriodicUpdateSwitch(false);
            } else if (seconds % 10 === 3 && !periodicUpdateSwitch) {
                setPeriodicUpdateSwitch(true);
            }
        }
    }, [whiteTimeRem]);

    useEffect(() => {
        if (blackTimeRem !== null) {
            const seconds = Math.round(blackTimeRem / 1000);

            if (seconds % 10 === 0 && periodicUpdateSwitch) {
                socket.emit("get-time", game.gameId);
                setPeriodicUpdateSwitch(false);
            } else if (seconds % 10 === 3 && !periodicUpdateSwitch) {
                setPeriodicUpdateSwitch(true);
            }
        }
    }, [blackTimeRem]);

    return { whiteTimeRem, blackTimeRem };
};

export default useTimers;
