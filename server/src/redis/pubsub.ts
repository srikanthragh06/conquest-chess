import { io } from "../server";
import { gameType, lobbyType, movesType } from "../state/state";
import { socketEmitRoom } from "../utils/responseTemplates";

export const onSubscribePMessage = (
    pattern: string,
    channel: string,
    message: string
) => {
    try {
        // lobby-update
        if (channel.startsWith("lobby-update")) {
            const lobbyId = channel.split(":")[1];
            const lobby: lobbyType = JSON.parse(message);

            socketEmitRoom(io, lobbyId, "lobby-details", lobby);
        }
        // started-game
        else if (channel.startsWith("started-game")) {
            const { gameId, lobbyId, whiteSocketId, blackSocketId } =
                JSON.parse(message);

            const whiteSocket = io.sockets.sockets.get(whiteSocketId);
            if (whiteSocket) {
                if (gameId) whiteSocket.join(gameId);
                if (lobbyId) whiteSocket.leave(lobbyId);
            }
            const blackSocket = io.sockets.sockets.get(blackSocketId);
            if (blackSocket) {
                if (gameId) blackSocket.join(gameId);
                if (lobbyId) blackSocket.leave(lobbyId);
            }

            socketEmitRoom(io, gameId, "started-game", gameId);
        }
        // game-over
        else if (channel.startsWith("game-over")) {
            const gameId = channel.split(":")[1];
            const { game, moves }: { game: gameType; moves: movesType } =
                JSON.parse(message);

            socketEmitRoom(io, gameId, "game-over", {
                game,
                moves,
            });
        }
        // game-update
        else if (channel.startsWith("game-update")) {
            const gameId = channel.split(":")[1];
            const { game, moves }: { game: gameType; moves: movesType } =
                JSON.parse(message);

            socketEmitRoom(io, gameId, "game-update", {
                game,
                moves,
            });
        }
    } catch (err) {
        console.error(err);
    }
};
