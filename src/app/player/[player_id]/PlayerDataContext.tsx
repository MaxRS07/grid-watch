// src/app/player/[player_id]/PlayerDataContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlayerStats } from '@/types/stats';
import { Player, Team, Series } from '@/data/allData';
import { fetchPlayerById } from '@/lib/grid/players';
import { fetchPlayerStats } from '@/lib/grid/stats';
import { fetchTeamById } from '@/lib/grid/teams';
import { fetchSeriesWithFilters, SeriesProps } from '@/lib/grid/series';
import { filterSeriesByPlayer } from '@/lib/series-player-lookup';
import { FlatEvent, flattenEvents } from '@/lib/grid/seriesAnalysis';
import { getSeriesFile, getSeriesFileList } from '@/lib/grid/files';
import { analysePlayerEvents, mergePlayerAnalysis } from '@/lib/grid/playerAnalysis';
import { PlayerValorantAnalysis } from '@/lib/grid/playerAnalysisTypes';
import { getPlayerReport, savePlayerReport, createPlayerReportRequest } from '@/lib/supabase/store';
import {
    getCachedSeriesForPlayer,
    addPlayerSeriesToCache,
    initializeSeriesCache,
    isCacheInitialized
} from '@/lib/series-cache';

type PlayerDataContextType = {
    player: Player | null;
    playerStats: PlayerStats | null;
    playerAnalysis: PlayerValorantAnalysis | null;
    team: Team | null;
    playerSeries: Series[] | null;
    seriesEvents: Record<string, FlatEvent[]>;
    loadedSeriesCount: number;
    status?: string;
    loading: boolean;
    seriesLoading: boolean;
    error: string | null;
    timeWindow: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL';
    setTimeWindow: (window: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL') => void;
};

const PlayerDataContext = createContext<PlayerDataContextType | null>(null);

export function PlayerDataProvider({
    playerId,
    children,
}: {
    playerId: string;
    children: ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [player, setPlayer] = useState<Player | null>(null);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [playerAnalysis, setPlayerAnalysis] = useState<PlayerValorantAnalysis | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [playerSeries, setPlayerSeries] = useState<Series[] | null>(null);
    const [seriesEvents, setSeriesEvents] = useState<Record<string, FlatEvent[]>>({});
    const seriesAnalysisCacheRef = useRef<Record<string, PlayerValorantAnalysis>>({});
    const [loadedSeriesCount, setLoadedSeriesCount] = useState(0);
    const [status, setStatus] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [seriesLoading, setSeriesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeWindow, setTimeWindowState] = useState<'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL'>('3_MONTHS');

    const timeWindowMillis: Record<string, number> = {
        'WEEK': 7 * 24 * 60 * 60 * 1000,
        'MONTH': 30 * 24 * 60 * 60 * 1000,
        '3_MONTHS': 90 * 24 * 60 * 60 * 1000,
        '6_MONTHS': 180 * 24 * 60 * 60 * 1000,
        'YEAR': 365 * 24 * 60 * 60 * 1000,
        'ALL': 5 * 365 * 24 * 60 * 60 * 1000,
    };

    // Initialize timeWindow from URL parameters
    useEffect(() => {
        const urlTimeWindow = searchParams.get('timeWindow');
        if (urlTimeWindow && ['WEEK', 'MONTH', '3_MONTHS', '6_MONTHS', 'YEAR', 'ALL'].includes(urlTimeWindow)) {
            setTimeWindowState(urlTimeWindow as 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL');
        }
    }, [searchParams]);

    // Wrapper for setTimeWindow that also updates URL - memoized to prevent rerenders
    const setTimeWindow = useCallback((window: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL') => {
        setTimeWindowState(window);
        const params = new URLSearchParams(searchParams);
        params.set('timeWindow', window);
        router.push(`?${params.toString()}`);
    }, [searchParams, router]);

    useEffect(() => {
        if (!playerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        Promise.all([
            fetchPlayerById(playerId),
            fetchPlayerStats(playerId, timeWindow == 'ALL' ? 'YEAR' : timeWindow),
        ])
            .then(([playerData, statsData]) => {
                setPlayer(prev => prev ?? playerData);
                setPlayerStats(statsData);

                // Fetch team if player has a teamId
                if (playerData.team?.id) {
                    fetchTeamById(playerData.team.id)
                        .then((teamData) => setTeam(teamData))
                        .catch((err) => console.error('Error fetching team:', err));
                }
            })
            .catch((err) => {
                console.error('Error fetching player data:', err);
                setError(err.message || 'Failed to load player data');
            })
            .finally(() => setLoading(false));
    }, [playerId, timeWindow]);

    // Load series in background with parallel file loading
    useEffect(() => {
        if (!player?.id) return;

        setSeriesLoading(true);
        setSeriesEvents({});
        setLoadedSeriesCount(0);
        setStatus(`Checking for existing report...`);
        let allPlayerSeries: Series[] = [];
        let hasNextPage = true;
        let cursor: string | null = null;

        const loadSeriesPages = async () => {
            try {
                // Check if a report already exists for this player and time window
                const existingReportResponse = await getPlayerReport(playerId, timeWindow);
                if (existingReportResponse.success && existingReportResponse.data?.report_text) {
                    setStatus(undefined);
                    setSeriesLoading(false);
                    // Report exists, no need to generate a new one
                    return;
                }

                setStatus(`Gathering series for ${playerId}`);

                const startDate = Date.now() - timeWindowMillis[timeWindow];
                const endDate = Date.now();

                // First, try to get cached series for this player and date range
                let playerSeriesIds = getCachedSeriesForPlayer(playerId, startDate, endDate);

                if (!playerSeriesIds) {
                    // Not in cache, fetch from API
                    playerSeriesIds = [];
                    let hasNextPage = true;
                    let cursor: string | null = null;

                    while (hasNextPage) {
                        const filter: SeriesProps = {
                            first: 50,
                            after: cursor,
                            titleId: player.title.id,
                            startDate: startDate,
                            endDate: endDate,
                        };

                        const response = await fetchSeriesWithFilters(filter);

                        // Filter each page to only series where this player participated
                        const pagePlayerSeries = await filterSeriesByPlayer(response.data, player.id);
                        allPlayerSeries.push(...pagePlayerSeries);
                        playerSeriesIds.push(...pagePlayerSeries.map(s => s.id));

                        // Update state incrementally after each page loads to enable progressive rendering
                        setPlayerSeries([...allPlayerSeries]);

                        hasNextPage = response.pageInfo.hasNextPage;
                        cursor = response.pageInfo.endCursor;
                    }

                    // Cache the result for future queries
                    addPlayerSeriesToCache(playerId, startDate, endDate, playerSeriesIds);
                } else {
                    // Use cached series IDs to fetch full series objects
                    const response = await fetchSeriesWithFilters({
                        first: 100,
                        titleId: player.title.id,
                    });

                    allPlayerSeries = response.data.filter(s => playerSeriesIds && playerSeriesIds.includes(s.id));
                    setPlayerSeries(allPlayerSeries);
                }

                // After all series pages are loaded, process and analyze incrementally
                setStatus('Analyzing performance...');

                try {
                    // Process series incrementally to avoid memory issues
                    // Instead of collecting all events, we analyze each series and merge results
                    let cumulativeAnalysis: PlayerValorantAnalysis | null = null;
                    const BATCH_SIZE = 3; // Process in small batches to allow GC
                    let updateCounter = 0;
                    const UPDATE_FREQUENCY = 2; // Only update state every N series

                    for (let i = 0; i < allPlayerSeries.length; i++) {
                        const series = allPlayerSeries[i];
                        const seriesTournament = series.tournamentName || series.title?.name || 'Series';
                        setStatus(`Analyzing series: ${seriesTournament} (${i + 1}/${allPlayerSeries.length})`);
                        setLoadedSeriesCount(i + 1);

                        try {
                            // Check if we have this series analysis cached
                            if (seriesAnalysisCacheRef.current[series.id]) {
                                const cachedAnalysis = seriesAnalysisCacheRef.current[series.id];

                                // Merge with cumulative analysis
                                if (cumulativeAnalysis) {
                                    cumulativeAnalysis = mergePlayerAnalysis(cumulativeAnalysis, cachedAnalysis);
                                } else {
                                    cumulativeAnalysis = cachedAnalysis;
                                }
                            } else {
                                // Download file list for this series
                                const fileList = await getSeriesFileList(series.id);
                                const eventFile = fileList.files.find((file) => file.id.startsWith('events-grid'));

                                if (eventFile) {
                                    // Download and process file
                                    const data = await getSeriesFile(series.id, 'events');
                                    const events = flattenEvents(data);

                                    if (events && events.length > 0) {
                                        // Analyze this single series immediately
                                        const seriesAnalysis = analysePlayerEvents(playerId, [{ series, events }]);

                                        // Cache the analysis for this series (using ref to avoid re-renders)
                                        seriesAnalysisCacheRef.current[series.id] = seriesAnalysis;

                                        // Merge with cumulative analysis
                                        if (cumulativeAnalysis) {
                                            cumulativeAnalysis = mergePlayerAnalysis(cumulativeAnalysis, seriesAnalysis);
                                        } else {
                                            cumulativeAnalysis = seriesAnalysis;
                                        }
                                    }
                                }
                            }

                            // Update analysis state less frequently to reduce re-renders
                            updateCounter++;
                            if (updateCounter % UPDATE_FREQUENCY === 0 && cumulativeAnalysis) {
                                setPlayerAnalysis(cumulativeAnalysis);
                            }

                            // Allow garbage collection between batches
                            if ((i + 1) % BATCH_SIZE === 0) {
                                await new Promise(resolve => setTimeout(resolve, 10));
                            }
                        } catch (seriesErr) {
                            console.error(`Error processing series ${i + 1}:`, seriesErr);
                            // Continue with next series
                            continue;
                        }
                    }

                    // Final update with complete analysis
                    if (cumulativeAnalysis) {
                        setPlayerAnalysis(cumulativeAnalysis);

                        // Save the generated report to database
                        const reportRequest = createPlayerReportRequest(
                            playerId,
                            timeWindow,
                            JSON.stringify(cumulativeAnalysis), // or extract a text summary
                            allPlayerSeries.length,
                            new Date(Date.now() - timeWindowMillis[timeWindow]).toISOString()
                        );

                        await savePlayerReport(reportRequest).catch(err =>
                            console.error('Failed to save player report:', err)
                        );
                    }
                } catch (analysisErr) {
                    console.error('Error analyzing player events:', analysisErr);
                    setError('Failed to analyze player performance data. Try a shorter time window.');
                }

                setStatus(undefined);
                setSeriesLoading(false);
            } catch (err) {
                console.error('Error fetching player series:', err);
                setError(err instanceof Error ? err.message : 'Failed to load player series');
                setSeriesLoading(false);
            }
        };

        loadSeriesPages();

        // Cleanup: clear cache when unmounting or switching time windows
        return () => {
            seriesAnalysisCacheRef.current = {};
        };
    }, [playerId, timeWindow]);

    return (
        <PlayerDataContext.Provider value={{
            player,
            playerStats,
            playerAnalysis,
            team,
            playerSeries,
            seriesEvents,
            loadedSeriesCount,
            status,
            loading,
            seriesLoading,
            error,
            timeWindow,
            setTimeWindow
        }}>
            {children}
        </PlayerDataContext.Provider>
    );
}

export function usePlayerData() {
    const ctx = useContext(PlayerDataContext);
    if (!ctx) {
        throw new Error('usePlayerData must be used inside PlayerDataProvider');
    }
    return ctx;
}