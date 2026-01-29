import { Series } from "@/data/allData";
import { getCachedData } from "@/lib/cache";
export interface SeriesResponse {
    data: Series[];
    pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
        hasPreviousPage: boolean;
        startCursor: string | null;
    };
}
export interface SeriesProps {
    first?: number;
    after?: string | null;
    live?: boolean;
    teamId?: string;
    titleId?: string;
    seriesId?: string;
    gameIdByExternalId?: string;
    tournamentIdByExternalId?: string;
    seriesIdByExternalId?: string;
    dataProviderName?: string;
    livePlayerIds?: string[];
    startDate?: number;
    endDate?: number;
}

/**
 * Fetch series with advanced filtering and pagination
 */
export async function fetchSeriesWithFilters(
    filters: SeriesProps
): Promise<SeriesResponse> {
    const params = new URLSearchParams();

    // Pagination parameters
    if (filters.first) {
        params.append("first", filters.first.toString());
    }

    if (filters.after) {
        params.append("after", filters.after);
    }

    // Filter parameters
    if (filters.live !== undefined) {
        params.append("live", filters.live.toString());
    }

    if (filters.teamId) {
        params.append("teamId", filters.teamId);
    }

    if (filters.titleId) {
        params.append("titleId", filters.titleId);
    }

    if (filters.seriesId) {
        params.append("seriesId", filters.seriesId);
    }

    if (filters.gameIdByExternalId) {
        params.append("gameIdByExternalId", filters.gameIdByExternalId);
    }

    if (filters.tournamentIdByExternalId) {
        params.append("tournamentIdByExternalId", filters.tournamentIdByExternalId);
    }

    if (filters.seriesIdByExternalId) {
        params.append("seriesIdByExternalId", filters.seriesIdByExternalId);
    }

    if (filters.dataProviderName) {
        params.append("dataProviderName", filters.dataProviderName);
    }

    if (filters.livePlayerIds) {
        params.append("livePlayerIds", filters.livePlayerIds.join(","));
    }

    if (filters.startDate) {
        params.append("startDate", filters.startDate.toString());
    }

    if (filters.endDate) {
        params.append("endDate", filters.endDate.toString());
    }

    // Create cache key based on filters
    const cacheKey = `series:filtered:${JSON.stringify(filters)}`;

    return getCachedData(
        cacheKey,
        async () => {
            const res = await fetch(`/api/series?${params.toString()}`);

            console.log(res.url);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            return res.json();
        },
        5 * 60 * 1000 // Cache for 5 minutes
    );
}

/**
 * Fetch upcoming series (optionally paginated)
 */
export async function fetchSeries(
    first: number = 50,
    after: string | null = null
): Promise<SeriesResponse> {
    return fetchSeriesWithFilters({
        first,
        after,
    });
}

/**
 * Fetch a single series by ID
 */
export async function fetchSeriesById(seriesId: string): Promise<Series> {
    return getCachedData(
        `series:${seriesId}`,
        async () => {
            const res = await fetch(`/api/series?seriesId=${seriesId}`);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            return res.json();
        },
        10 * 60 * 1000 // Cache for 10 minutes
    );
}

/**
 * Fetch available series formats
 */
export async function fetchSeriesFormats() {
    const res = await fetch(`/api/series/formats`);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend API error: ${res.status} - ${text}`);
    }

    return res.json();
}
