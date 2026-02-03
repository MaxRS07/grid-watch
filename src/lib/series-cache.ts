import { fetchSeriesWithFilters, SeriesProps } from '@/lib/grid/series';
import { filterSeriesByPlayer } from '@/lib/series-player-lookup';

interface SeriesCacheEntry {
    seriesIds: string[];
    timestamp: number;
}

type SeriesCacheMap = Record<string, Record<string, SeriesCacheEntry>>;

// Global in-memory cache for series by player and date range
let seriesCache: SeriesCacheMap = {};
let allSeriesIds: string[] = [];
let cacheInitialized = false;
let cacheInitializing = false;

/**
 * Generate cache key from player ID and date range
 */
export function generateCacheKey(playerId: string, startDate: number, endDate: number): string {
    return `${playerId}:${startDate}:${endDate}`;
}

/**
 * Get cached series IDs for a player within a date range
 */
export function getCachedSeriesForPlayer(
    playerId: string,
    startDate: number,
    endDate: number
): string[] | null {
    const key = generateCacheKey(playerId, startDate, endDate);
    if (seriesCache[playerId]?.[key]) {
        return seriesCache[playerId][key].seriesIds;
    }
    return null;
}

/**
 * Check if cache is initialized
 * Note: With lazy loading, cache is considered "initialized" once it has any data
 */
export function isCacheInitialized(): boolean {
    return allSeriesIds.length > 0;
}

/**
 * Check if cache is currently initializing
 */
export function isCacheInitializing(): boolean {
    return cacheInitializing;
}

/**
 * Initialize the series cache by loading all series from the past 5 years
 * This runs in the background and doesn't block the UI
 * NOTE: Disabled in favor of lazy loading as players are analyzed
 */
export async function initializeSeriesCache(): Promise<void> {
    // This is now disabled - cache is populated as players are analyzed
    // See PlayerDataContext for lazy cache population
}

/**
 * Add player series to cache
 * Call this after fetching and filtering series for a player
 */
export function addPlayerSeriesToCache(
    playerId: string,
    startDate: number,
    endDate: number,
    seriesIds: string[]
): void {
    if (!seriesCache[playerId]) {
        seriesCache[playerId] = {};
    }

    const key = generateCacheKey(playerId, startDate, endDate);
    seriesCache[playerId][key] = {
        seriesIds,
        timestamp: Date.now(),
    };

    // Update allSeriesIds with new series IDs (avoid duplicates)
    const newIds = seriesIds.filter(id => !allSeriesIds.includes(id));
    if (newIds.length > 0) {
        allSeriesIds.push(...newIds);
    }
}

/**
 * Get all cached series IDs
 */
export function getAllCachedSeriesIds(): string[] {
    return [...allSeriesIds];
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearSeriesCache(): void {
    seriesCache = {};
    allSeriesIds = [];
    cacheInitialized = false;
    cacheInitializing = false;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    initialized: boolean;
    totalSeries: number;
    cachedPlayers: number;
    cachedPlayerRanges: number;
} {
    let totalRanges = 0;
    Object.values(seriesCache).forEach(playerCache => {
        totalRanges += Object.keys(playerCache).length;
    });

    return {
        initialized: cacheInitialized,
        totalSeries: allSeriesIds.length,
        cachedPlayers: Object.keys(seriesCache).length,
        cachedPlayerRanges: totalRanges,
    };
}
