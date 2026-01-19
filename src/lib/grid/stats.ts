import { TimeWindow } from "@/app/api/stats/route";
import { PlayerStats } from "@/types/stats";
import { getCachedData } from "@/lib/cache";


export type TeamStats = PlayerStats; // same structure

const API_BASE = '/api/stats';

async function fetchStats(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
    return res.json();
}

/** Player statistics for last 3 months */
export async function fetchPlayerStats(playerId: string, timeWindow: TimeWindow): Promise<PlayerStats> {
    return getCachedData(
        `player-stats:${playerId}:${timeWindow}`,
        async () => {
            const url = `${API_BASE}?type=player&id=${playerId}&timeWindow=${timeWindow}`;
            const data = await fetchStats(url);
            return data.playerStatistics;
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

/** Player statistics for chosen tournaments */
export async function fetchPlayerStatsTournaments(playerId: string, tournamentIds: string[]): Promise<PlayerStats> {
    return getCachedData(
        `player-stats:${playerId}:tournaments:${tournamentIds.join(',')}`,
        async () => {
            const url = `${API_BASE}?type=player&id=${playerId}&tournaments=${tournamentIds.join(',')}`;
            const data = await fetchStats(url);
            return data.playerStatistics;
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

/** Team statistics for last 3 months */
export async function fetchTeamStats(teamId: string, timeWindow: TimeWindow): Promise<TeamStats> {
    return getCachedData(
        `team-stats:${teamId}:${timeWindow}`,
        async () => {
            const url = `${API_BASE}?type=team&id=${teamId}&timeWindow=${timeWindow}`;
            const data = await fetchStats(url);
            return data.teamStatistics;
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

/** Team statistics for chosen tournaments */
export async function fetchTeamStatsTournaments(teamId: string, tournamentIds: string[]): Promise<TeamStats> {
    return getCachedData(
        `team-stats:${teamId}:tournaments:${tournamentIds.join(',')}`,
        async () => {
            const url = `${API_BASE}?type=team&id=${teamId}&tournaments=${tournamentIds.join(',')}`;
            const data = await fetchStats(url);
            return data.teamStatistics;
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}
