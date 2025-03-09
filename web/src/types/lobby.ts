export type lobbyType = {
    lobbyId: string;
    hostId: string;
    players: string[];
    matchType: "Blitz" | "Bullet" | "Rapid";
    participants: [string | null, string | null];
};
