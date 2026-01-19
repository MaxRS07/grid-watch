import { Player } from "@/data/allData";
import { getCachedData } from "@/lib/cache";

export interface PlayersResponse {
    data: Player[];
    pageInfo: {
        endCursor: string | null;
        startCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        totalCount: number;
    };
}

// Fetch top players with pagination support (max 50 per request)
export async function fetchPlayers(first: number = 30, after: string | null = null): Promise<PlayersResponse> {
    // Cap at 50 items
    const cappedFirst = Math.min(first, 50);

    return getCachedData(
        `players:top:${cappedFirst}:${after || 'null'}`,
        async () => {
            const res = await fetch(`/api/players?first=${cappedFirst}${after ? `&after=${encodeURIComponent(after)}` : ''}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }
            return res.json();
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

// Fetch a single player by ID
export async function fetchPlayerById(playerId: string): Promise<Player> {
    return getCachedData(
        `player:${playerId}`,
        async () => {
            const res = await fetch(`/api/players?playerId=${playerId}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }
            return res.json();
        },
        15 * 60 * 1000 // Cache for 15 minutes
    );
}

// Fetch all players for a team
export async function fetchTeamPlayers(teamId: string): Promise<Player[]> {
    return getCachedData(
        `team-players:${teamId}`,
        async () => {
            const res = await fetch(`/api/players?teamId=${teamId}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }
            const response: PlayersResponse = await res.json();
            return response.data;
        },
        10 * 60 * 1000 // Cache for 10 minutes
    );
}

// Search players by nickname
export async function searchPlayersByNickname(nickname: string, first: number = 30, after: string | null = null): Promise<PlayersResponse> {
    // Cap at 50 items
    const cappedFirst = Math.min(first, 50);

    return getCachedData(
        `players:search:${nickname}:${cappedFirst}:${after || 'null'}`,
        async () => {
            const res = await fetch(`/api/players?nickname=${encodeURIComponent(nickname)}&first=${cappedFirst}${after ? `&after=${encodeURIComponent(after)}` : ''}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }
            return res.json();
        },
        3 * 60 * 1000 // Cache for 3 minutes - search results are more dynamic
    );
}
