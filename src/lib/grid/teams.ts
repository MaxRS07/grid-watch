import { Team } from "@/data/allData";
import { getCachedData } from "@/lib/cache";

export interface TeamsResponse {
    data: Team[];
    pageInfo: {
        endCursor: string | null;
        startCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        totalCount: number;
    };
}

// This now calls your backend API route with pagination support
export async function fetchTeams(first: number = 48, after: string | null = null): Promise<TeamsResponse> {
    // Cap at 50 items
    const cappedFirst = Math.min(first, 50);

    return getCachedData(
        `teams:all:${cappedFirst}:${after || 'null'}`,
        async () => {
            const res = await fetch(`/api/teams?first=${cappedFirst}${after ? `&after=${encodeURIComponent(after)}` : ''}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            const data = await res.json();
            return data;
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

// Search teams by name
export async function searchTeamsByName(name: string, first: number = 48, after: string | null = null): Promise<TeamsResponse> {
    // Cap at 50 items
    const cappedFirst = Math.min(first, 50);

    return getCachedData(
        `teams:search:${name}:${cappedFirst}:${after || 'null'}`,
        async () => {
            const res = await fetch(`/api/teams?name=${encodeURIComponent(name)}&first=${cappedFirst}${after ? `&after=${encodeURIComponent(after)}` : ''}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            return res.json();
        },
        3 * 60 * 1000 // Cache for 3 minutes - search results are more dynamic
    );
}

export async function fetchTeamById(teamId: string): Promise<Team> {
    return getCachedData(
        `team:${teamId}`,
        async () => {
            const res = await fetch(`/api/teams?teamId=${teamId}`); // call your Next.js API route
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            const team: Team = await res.json();
            return team;
        },
        15 * 60 * 1000 // Cache for 15 minutes - team data changes less frequently
    );
}