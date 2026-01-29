// src/app/player/[player_id]/PlayerDataContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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

type PlayerDataContextType = {
    player: Player | null;
    playerStats: PlayerStats | null;
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
    const [team, setTeam] = useState<Team | null>(null);
    const [playerSeries, setPlayerSeries] = useState<Series[] | null>(null);
    const [seriesEvents, setSeriesEvents] = useState<Record<string, FlatEvent[]>>({});
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
        setStatus(`Gathering series for ${playerId}`);
        const allPlayerSeries: Series[] = [];
        let hasNextPage = true;
        let cursor: string | null = null;

        const loadSeriesPages = async () => {
            try {
                while (hasNextPage) {
                    const filter: SeriesProps = {
                        first: 50,
                        after: cursor,
                        titleId: player.title.id,
                        startDate: Date.now() - timeWindowMillis[timeWindow],
                        endDate: Date.now(),
                    };

                    const response = await fetchSeriesWithFilters(filter);

                    // Filter each page to only series where this player participated
                    const pagePlayerSeries = await filterSeriesByPlayer(response.data, player.id);
                    allPlayerSeries.push(...pagePlayerSeries);

                    // Update state incrementally after each page loads to enable progressive rendering
                    setPlayerSeries([...allPlayerSeries]);

                    hasNextPage = response.pageInfo.hasNextPage;
                    cursor = response.pageInfo.endCursor;
                }

                // After all series pages are loaded, load events in parallel
                setStatus('Loading events...');
                const allEvents = await loadSeriesEventsInParallel(allPlayerSeries);
                setSeriesEvents(allEvents);
                setLoadedSeriesCount(allPlayerSeries.length);
                setStatus(undefined);
                setSeriesLoading(false);

                console.log(allEvents);
            } catch (err) {
                console.error('Error fetching player series:', err);
                setSeriesLoading(false);
            }
        };

        loadSeriesPages();
    }, [player?.id, timeWindow]);

    // Load series events in parallel with limited concurrency
    const loadSeriesEventsInParallel = async (seriesList: Series[]): Promise<Record<string, FlatEvent[]>> => {
        const result: Record<string, FlatEvent[]> = {};
        const CONCURRENCY = 5; // Load 5 series in parallel
        const queue = [...seriesList];
        const inFlight = new Set<Promise<void>>();
        let loadedCount = 0;

        const processNextSeries = async (): Promise<void> => {
            while (queue.length > 0) {
                const series = queue.shift();
                if (!series) break;

                try {
                    const seriesName = series.title?.name + " - " + series.tournamentName;
                    setStatus(`Loading ${seriesName}...`);

                    // Download file list
                    const fileList = await getSeriesFileList(series.id);
                    const eventFile = fileList.files.find((file) => file.id.startsWith('events-grid'));

                    if (eventFile) {
                        // Download and process file
                        const data = await getSeriesFile(series.id, 'events');
                        const events = flattenEvents(data);
                        result[series.id] = events;
                    }
                } catch (error) {
                    console.error(`Error fetching events for series ${series.id}:`, error);
                    result[series.id] = [];
                }

                loadedCount++;
                setLoadedSeriesCount(loadedCount);
            }
        };

        // Start concurrent workers
        for (let i = 0; i < CONCURRENCY; i++) {
            const promise = processNextSeries();
            inFlight.add(promise);
            promise.then(() => inFlight.delete(promise));
        }

        // Wait for all workers to complete
        await Promise.all(inFlight);
        return result;
    };

    return (
        <PlayerDataContext.Provider value={{
            player,
            playerStats,
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