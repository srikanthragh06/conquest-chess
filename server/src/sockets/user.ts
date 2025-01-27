import { Socket } from "socket.io";
import { socket2User, user2Socket } from "../state/state";
import { socketEmit } from "../utils/responseTemplates";

export const onRegisterUser = (userId: string, socket: Socket) => {
    const oldUserId = socket2User.get(socket.id);
    if (oldUserId) {
        user2Socket.delete(oldUserId);
        socket2User.delete(socket.id);
    }

    socket2User.set(socket.id, userId);
    user2Socket.set(userId, socket.id);

    socketEmit(socket, "registered-user");
};
