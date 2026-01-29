'use client';

import { useEffect } from 'react';
import { useTeamData } from '../TeamDataContext';

export default function TeamStatsPage() {
    const { teamStats, teamPlayers, loading, error } = useTeamData();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading team statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!teamStats) {
        return (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <p className="text-zinc-600 dark:text-zinc-400">No statistics available</p>
            </div>
        );
    }

    // Calculate aggregate wins statistics
    // wins array has 2 objects: one with value: true (wins), one with value: false (losses)
    const lossesEntry = teamStats.game.wins[0];
    const winsEntry = teamStats.game.wins[1];
    const totalWins = winsEntry.count;
    const avgWinPercentage = winsEntry.percentage;
    const bestStreak = winsEntry.streak.max;
    const worstStreak = lossesEntry.streak.max;

    return (
        <>
            {/* Game Stats Overview */}
            <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Game Performance Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Games Played</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {teamStats.game.count}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Wins</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {totalWins}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg Win Rate</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {avgWinPercentage.toFixed(1)}%
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Best Streak</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {bestStreak}
                        </p>
                    </div>
                </div>
            </div>

            {/* Series Stats */}
            {teamStats.series && (
                <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Series Performance
                    </h2>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Series Count</p>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {teamStats.series.count}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Kills</p>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {teamStats.series.kills.sum}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Avg Kills</p>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {teamStats.series.kills.avg.toFixed(1)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Min Kills</p>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {teamStats.series.kills.min}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Max Kills</p>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {teamStats.series.kills.max}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Segment Stats */}
            {teamStats.segment && teamStats.segment.length > 0 && (
                <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Segment Statistics
                    </h2>
                    <div className="space-y-4">
                        {teamStats.segment.map((seg, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                            >
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 uppercase">
                                    {seg.type}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Count</p>
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {seg.count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Deaths</p>
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {seg.deaths.sum}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Avg Deaths</p>
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {seg.deaths.avg.toFixed(1)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Min Deaths</p>
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {seg.deaths.min}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Max Deaths</p>
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {seg.deaths.max}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Team Players */}
            {teamPlayers && teamPlayers.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
                        Team Roster ({teamPlayers.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamPlayers.map((player, i) => (
                            <a
                                key={i}
                                href={`/player/${player.id}`}
                            >
                                <div className="group p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-zinc-950 cursor-pointer h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                                {player.name}
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                ID: {player.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
