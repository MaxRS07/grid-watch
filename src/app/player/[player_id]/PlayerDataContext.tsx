// src/app/player/[player_id]/PlayerDataContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PlayerStats } from '@/types/stats';
import { Player, Team } from '@/data/allData';
import { fetchPlayerById } from '@/lib/grid/players';
import { fetchPlayerStats } from '@/lib/grid/stats';
import { fetchTeamById } from '@/lib/grid/teams';

type PlayerDataContextType = {
    player: Player | null;
    playerStats: PlayerStats | null;
    team: Team | null;
    loading: boolean;
    error: string | null;
    timeWindow: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR';
    setTimeWindow: (window: 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR') => void;
};

const PlayerDataContext = createContext<PlayerDataContextType | null>(null);

export function PlayerDataProvider({
    playerId,
    children,
}: {
    playerId: string;
    children: ReactNode;
}) {
    const [player, setPlayer] = useState<Player | null>(null);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeWindow, setTimeWindow] = useState<'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR'>('3_MONTHS');

    useEffect(() => {
        if (!playerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        Promise.all([
            fetchPlayerById(playerId),
            fetchPlayerStats(playerId, timeWindow),
        ])
            .then(([playerData, statsData]) => {
                setPlayer(prev => prev ?? playerData);
                setPlayerStats(statsData);

                // Fetch team if player has a teamId
                if (playerData.teamId) {
                    fetchTeamById(playerData.teamId)
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

    return (
        <PlayerDataContext.Provider value={{ player, playerStats, team, loading, error, timeWindow, setTimeWindow }}>
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