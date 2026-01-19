import { SeriesState } from '@/types/series-stats';
import { getCachedData } from '@/lib/cache';

/**
 * Fetch series state with detailed game and player statistics
 */
export async function fetchSeriesStats(seriesId: string): Promise<SeriesState> {
    return getCachedData(
        `series-stats:${seriesId}`,
        async () => {
            const res = await fetch(`/api/series-stats?seriesId=${seriesId}`);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            const root: SeriesState = await res.json();

            console.log('Fetched series stats from API:', root);

            return root;
        },
        10 * 60 * 1000 // Cache for 10 minutes
    );
}
