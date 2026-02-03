// src/app/series/[series_id]/SeriesDataContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SeriesState } from '@/types/series-stats';
import { Series, Team } from '@/data/allData';
import { fetchSeriesStats } from '@/lib/grid/series-stats';
import { fetchTeamById } from '@/lib/grid/teams';
import { fetchSeriesById } from '@/lib/grid/series';

type SeriesDataContextType = {
    series: Series | null;
    seriesStats: SeriesState | null;
    teams: Team[];
    loading: boolean;
    error: string | null;
};

const SeriesDataContext = createContext<SeriesDataContextType | null>(null);

export function SeriesDataProvider({
    seriesId,
    children,
}: {
    seriesId: string;
    children: ReactNode;
}) {
    const [series, setSeries] = useState<Series | null>(null);
    const [seriesStats, setSeriesStats] = useState<SeriesState | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!seriesId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        fetchSeriesById(seriesId).then((s) => {
            setSeries(s);
        });
        fetchSeriesStats(seriesId)
            .then(async (statsData) => {
                setSeriesStats(statsData);

                // Fetch full team objects for each team in the series
                const teamPromises = statsData.teams.map((team) =>
                    fetchTeamById(team.id).catch((err) => {
                        console.warn(`Failed to fetch team ${team.id}:`, err);
                        return null;
                    })
                );

                const fetchedTeams = await Promise.all(teamPromises);

                // Combine fetched teams with series data, filtering out failed fetches
                const seriesTeams: Team[] = fetchedTeams
                    .filter((team): team is Team => team !== null)
                    .map((team) => {
                        const seriesTeam = statsData.teams.find(t => t.id === team.id);
                        return {
                            ...team,
                            won: seriesTeam?.won || false,
                        };
                    });

                console.log('Fetched series teams:', seriesTeams);
                setTeams(seriesTeams);
            })
            .catch((err) => {
                console.error('Error fetching series data:', err);
                setError(err.message || 'Failed to load series data');
            })
            .finally(() => setLoading(false));
    }, [seriesId]);

    return (
        <SeriesDataContext.Provider value={{ series, seriesStats, teams, loading, error }}>
            {children}
        </SeriesDataContext.Provider>
    );
}

export function useSeriesData() {
    const ctx = useContext(SeriesDataContext);
    if (!ctx) {
        throw new Error('useSeriesData must be used inside SeriesDataProvider');
    }
    return ctx;
}
