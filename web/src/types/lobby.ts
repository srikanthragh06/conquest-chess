export type lobbyType = {
    lobbyId: string;
    hostId: string;
    players: string[];
    matchType: "Blitz" | "Bullet" | "Rapid";
    emptySince: number | null;
    participants: [string | null, string | null];
};
