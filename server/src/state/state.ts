// users

export const socket2User: Map<string, string> = new Map();
export const user2Socket: Map<string, string> = new Map();

export type lobbyType = {
    lobbyId: string;
    hostId: string;
    players: string[];
    emptySince: number | null;
};

// lobbies

export const lobbies: Map<string, lobbyType> = new Map();
export const user2Lobby: Map<string, string> = new Map();

const cleanupLobbies = () => {
    const INACTIVITY_TIMEOUT = 2 * 60 * 1000;
    const now = Date.now();
    for (const [lobbyId, lobby] of lobbies) {
        if (lobby.emptySince && now - lobby.emptySince > INACTIVITY_TIMEOUT) {
            lobbies.delete(lobbyId);
        }
    }
};
setInterval(cleanupLobbies, 60 * 1000);
