'use client';

import { useTeamData } from '../TeamDataContext';

export default function TeamAnalysisPage() {
    const { teamStats, teamPlayers, loading, error } = useTeamData();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading team analysis...</p>
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

    if (!teamStats || !teamPlayers) {
        return (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <p className="text-zinc-600 dark:text-zinc-400">No analysis data available</p>
            </div>
        );
    }

    // Calculate analysis metrics
    const totalWins = teamStats.game.wins.reduce((sum, w) => sum + w.value, 0);
    const totalGames = teamStats.game.count;
    const totalWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    const totalKills = teamStats.series?.kills?.sum || 0;
    const seriesCount = teamStats.series?.count || 0;
    const avgKillsPerSeries = seriesCount > 0 ? (totalKills / seriesCount).toFixed(1) : 0;

    // Calculate player performance metrics from individual segments
    const playerMetrics = teamStats?.segment
        ?.map(segment => {
            const kd = segment.count > 0 ? (segment.count / Math.max(segment.deaths.sum, 1)) : 0;
            return {
                name: segment.type,
                kills: segment.count,
                deaths: segment.deaths.sum,
                kd: kd,
                matches: segment.count,
            };
        })
        .sort((a, b) => b.kd - a.kd) || [];

    const bestPlayer = playerMetrics[0];
    const avgTeamKD = playerMetrics.length > 0
        ? (playerMetrics.reduce((sum, p) => sum + p.kd, 0) / playerMetrics.length).toFixed(2)
        : 0;

    return (
        <>
            {/* Team Performance Overview */}
            <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Team Performance Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Win Rate</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {totalWinRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-2">
                            {totalWins} wins out of {totalGames}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg Team K/D</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {avgTeamKD}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Kills</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {totalKills}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Roster Size</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {teamPlayers.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Top Performers
                </h2>
                <div className="space-y-3">
                    {playerMetrics.slice(0, 5).map((player, idx) => (
                        <div
                            key={idx}
                            className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-900 dark:text-white">
                                        {player.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {player.matches} matches
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    {player.kd.toFixed(2)} K/D
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {player.kills}K / {player.deaths}D
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Player Statistics Table */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Player Statistics
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                                    Player
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                                    Matches
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                                    Kills
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                                    Deaths
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                                    K/D Ratio
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {playerMetrics.map((player, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                                >
                                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                                        {player.name}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                                        {player.matches}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                                        {player.kills}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                                        {player.deaths}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {player.kd.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
