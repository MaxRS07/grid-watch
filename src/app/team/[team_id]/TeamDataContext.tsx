'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TeamStats } from '@/lib/grid/stats';
import { Player, Series, Team } from '@/data/allData';
import { fetchTeamStats } from '@/lib/grid/stats';
import { fetchTeamPlayers } from '@/lib/grid/players';
import { fetchTeamById, fetchTeams } from '@/lib/grid/teams';
import { fetchSeriesWithFilters } from '@/lib/grid/series';

type TeamDataContextType = {
    team: Team | null;
    teamStats: TeamStats | null;
    teamPlayers: Player[] | null;
    teamSeries: Series[] | null;
    loading: boolean;
    error: string | null;
    timeWindow: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL';
    setTimeWindow: (window: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL') => void;
};

const TeamDataContext = createContext<TeamDataContextType | null>(null);

export function TeamDataProvider({
    teamId,
    children,
}: {
    teamId: string;
    children: ReactNode;
}) {
    const [team, setTeam] = useState<Team | null>(null);
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [teamPlayers, setTeamPlayers] = useState<Player[] | null>(null);
    const [teamSeries, setTeamSeries] = useState<Series[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeWindow, setTimeWindow] = useState<'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL'>('3_MONTHS');

    const timeWindowMillis: Record<string, number> = {
        'WEEK': 7 * 24 * 60 * 60 * 1000,
        'MONTH': 30 * 24 * 60 * 60 * 1000,
        '3_MONTHS': 90 * 24 * 60 * 60 * 1000,
        '6_MONTHS': 180 * 24 * 60 * 60 * 1000,
        'YEAR': 365 * 24 * 60 * 60 * 1000,
        'ALL': 10 * 365 * 24 * 60 * 60 * 1000,
    };

    useEffect(() => {
        if (!teamId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        Promise.all([
            fetchTeamById(teamId),
            fetchTeamPlayers(teamId),
            fetchTeamStats(teamId, timeWindow == 'ALL' ? 'YEAR' : timeWindow),
            fetchSeriesWithFilters(
                {
                    teamId: teamId,
                    startDate: Date.now() - timeWindowMillis[timeWindow],
                    endDate: Date.now()
                }),
        ])
            .then(([teamData, playersData, statsData, series]) => {
                setTeam(teamData);
                setTeamPlayers(playersData);
                setTeamStats(statsData);
                setTeamSeries(series);
            })
            .catch((err) => {
                console.error('Error fetching team data:', err);
                setError(err.message || 'Failed to load team data');
            })
            .finally(() => setLoading(false));
    }, [teamId, timeWindow]);

    return (
        <TeamDataContext.Provider value={{ team, teamStats, teamPlayers, teamSeries, loading, error, timeWindow, setTimeWindow }}>
            {children}
        </TeamDataContext.Provider>
    );
}

export function useTeamData() {
    const ctx = useContext(TeamDataContext);
    if (!ctx) {
        throw new Error('useTeamData must be used inside TeamDataProvider');
    }
    return ctx;
}
