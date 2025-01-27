import { Chess } from "chess.js";
import { Socket } from "socket.io";
// import { onCreateLobby, onJoinLobby } from "./lobby";
import { onRegisterUser } from "./user";
import { lobbies, socket2User, user2Lobby, user2Socket } from "../state/state";
import { onCreateLobby, onJoinLobby } from "./lobby";
import { io } from "../server";
import { logSocketOn } from "../utils/logging";
import { socketEmitRoom } from "../utils/responseTemplates";

const onJoinQueue = (socket: Socket) => {
    if (!queuePlayers.includes(socket)) {
        queuePlayers.push(socket);
        console.log(`${socket.id} added to the queue`);
        if (queuePlayers.length >= 2) {
            const player1Socket = queuePlayers.pop() as Socket;
            const player2Socket = queuePlayers.pop() as Socket;
            const roomId = Date.now().toString();
            gameRooms.set(roomId, {
                roomId,
                player1Socket,
                player2Socket,
                board: new Chess(),
            });
            if (player1Socket && player2Socket) {
                player1Socket.emit("match-found", {
                    roomId,
                    color: "white",
                });
                player2Socket.emit("match-found", {
                    roomId,
                    color: "black",
                });
                console.log(
                    `Match found between ${player1Socket.id} and ${player2Socket.id}`
                );
                player1Socket.join(roomId);
                player2Socket.join(roomId);
            }
        }
    }
};
const onDisconnect = (socket: Socket) => {
    const userId = socket2User.get(socket.id);
    if (userId) {
        socket2User.delete(socket.id);
        user2Socket.delete(userId);

        const userLobbyId = user2Lobby.get(userId);
        if (userLobbyId) {
            user2Lobby.delete(userId);
            const lobby = lobbies.get(userLobbyId);
            if (lobby) {
                if (lobby.players.includes(userId)) {
                    lobby.players = lobby.players.filter(
                        (playerId) => playerId !== userId
                    );
                    socket.leave(userLobbyId);

                    if (lobby.players.length === 0) {
                        lobby.emptySince = Date.now();
                    } else {
                        if (lobby.hostId === userId) {
                            lobby.hostId = lobby.players[0];
                        }
                    }
                }
                socketEmitRoom(io, userLobbyId, "lobby-details", lobby);
            }
        }
    }

    // Remove player from the queue if they disconnect
    const index = queuePlayers.indexOf(socket);
    if (index !== -1) {
        queuePlayers.splice(index, 1);
        console.log(`${socket.id} removed from the queue`);
    }
};
const onMakeMove = (socket: Socket, roomId: string, move: string) => {
    if (!gameRooms.has(roomId)) {
        console.log(`Game room with roomId: ${roomId} not found`);
        return;
    }
    const gameRoom = gameRooms.get(roomId);
    const { board, player1Socket, player2Socket } = gameRoom as gameRoomType;
    const currentTurn = board.turn();
    const isPlayer1 = socket.id === player1Socket.id;
    const isPlayer2 = socket.id === player2Socket.id;
    if (
        (currentTurn === "w" && !isPlayer1) || // If it's white's turn and it's not player 1
        (currentTurn === "b" && !isPlayer2) // If it's black's turn and it's not player 2
    ) {
        socket.emit("move-approval", {
            success: false,
            newFen: board.fen(),
            msg: "Not your turn",
        });
        return;
    }
    try {
        const newMove = board.move(move);
        if (!newMove) {
            socket.emit("move-approval", {
                success: false,
                newFen: board.fen(),
                msg: "Invalid move",
            });
            return;
        }
        io.to(roomId).emit("game-update", {
            move,
            boardFen: board.fen(),
        });
        socket.emit("move-approval", {
            success: true,
            newFen: board.fen(),
            msg: "Move approved",
        });
        // If the game is over, notify the players
        // if (board.isGameOver()) {
        //     const result = board.isCheckmate()
        //         ? "Checkmate"
        //         : board.isStalemate()
        //         ? "Stalemate"
        //         : "Game Over";
        //     player1Socket.emit("game-over", result);
        //     player2Socket.emit("game-over", result);
        // }
    } catch (error) {
        console.error("Error making move:", error);
    }
};

const queuePlayers: Socket[] = [];
type gameRoomType = {
    roomId: string;
    player1Socket: Socket;
    player2Socket: Socket;
    board: Chess;
};
const gameRooms: Map<string, gameRoomType> = new Map();

export const handleIOConnection = (socket: Socket) => {
    socket.onAny((event) => logSocketOn(socket, event));

    socket.on("register-user", ({ userId }: { userId: string }) =>
        onRegisterUser(userId, socket)
    );

    socket.on("join-queue", () => onJoinQueue(socket));
    socket.on(
        "make-move",
        ({ roomId, move }: { roomId: string; move: string }) => {
            onMakeMove(socket, roomId, move);
        }
    );

    socket.on("create-lobby", () => onCreateLobby(socket));

    socket.on("join-lobby", (lobbyId: string) => onJoinLobby(socket, lobbyId));

    socket.on("disconnect", () => onDisconnect(socket));
};
