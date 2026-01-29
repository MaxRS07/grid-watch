import { SeriesState } from '@/types/series-stats';
import { fetchSeriesStats } from '@/lib/grid/series-stats';

/**
 * Extract all unique player IDs from a series state
 * Returns a Set for O(1) lookup time
 */
export function extractPlayerIdsFromSeriesState(seriesState: SeriesState): Set<string> {
    const playerIds = new Set<string>();

    // Iterate through all games
    seriesState.games.forEach(game => {
        // Iterate through all teams in each game
        game.teams.forEach(team => {
            // Iterate through all players in each team
            team.players.forEach(player => {
                playerIds.add(player.id);
            });
        });
    });

    return playerIds;
}

/**
 * Check if a player participated in a series by fetching the series state
 * Uses efficient Set lookup for O(1) performance
 */
export async function playerInSeries(playerId: string, seriesId: string): Promise<boolean> {
    try {
        const seriesState = await fetchSeriesStats(seriesId);
        const playerIds = extractPlayerIdsFromSeriesState(seriesState);
        return playerIds.has(playerId);
    } catch (error) {
        console.error(`Error checking if player ${playerId} is in series ${seriesId}:`, error);
        return false;
    }
}

/**
 * Filter series to only include ones where the player participated
 * Fetches series state for each series to get accurate player lists
 */
export async function filterSeriesByPlayer(series: any[], playerId: string): Promise<any[]> {
    const results = await Promise.all(
        series.map(async (s) => {
            const participated = await playerInSeries(playerId, s.id);
            return { series: s, participated };
        })
    );

    return results
        .filter(result => result.participated)
        .map(result => result.series);
}
