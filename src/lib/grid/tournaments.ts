import { Tournament } from '@/data/allData';
import { getCachedData } from '@/lib/cache';

/**
 * Fetch all tournaments
 */
export async function fetchTournaments(): Promise<Tournament[]> {
    return getCachedData(
        'tournaments:all',
        async () => {
            const res = await fetch('/api/tournaments');

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            const data = await res.json();
            return data.tournaments;
        },
        30 * 60 * 1000 // Cache for 30 minutes - tournaments change infrequently
    );
}

/**
 * Fetch a single tournament by ID
 */
export async function fetchTournamentById(id: string): Promise<Tournament> {
    return getCachedData(
        `tournament:${id}`,
        async () => {
            const res = await fetch(`/api/tournaments?id=${id}`);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            const tournament: Tournament = await res.json();
            return tournament;
        },
        30 * 60 * 1000 // Cache for 30 minutes
    );
}
