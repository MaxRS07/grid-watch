'use client';

import { useSeriesData } from '../SeriesDataContext';

export default function SeriesStatsPage() {
    const { seriesStats, teams, loading, error } = useSeriesData();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            </div>
        );
    }

    if (!seriesStats) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-900 dark:text-white">No statistics found for this series.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {seriesStats.games.length} Games • Last Updated: {new Date(seriesStats.updatedAt).toLocaleString()}
            </div>

            {/* Series Overview */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Series Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Format</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {seriesStats.format}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Games Played</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {seriesStats.games.length}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Status</p>
                        <p className={`text-2xl font-bold ${seriesStats.finished ? 'text-green-600 dark:text-green-400' :
                            seriesStats.started ? 'text-blue-600 dark:text-blue-400' :
                                'text-yellow-600 dark:text-yellow-400'
                            }`}>
                            {seriesStats.finished ? 'Finished' : seriesStats.started ? 'Live' : 'Scheduled'}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Valid</p>
                        <p className={`text-2xl font-bold ${seriesStats.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {seriesStats.valid ? 'Yes' : 'No'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Team Results */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Team Results
                </h2>
                <div className="space-y-3">
                    {teams.map((team, idx) => (
                        <div
                            key={idx}
                            className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between"
                        >
                            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {team.name}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg font-bold ${team.won
                                    ? 'bg-green-600 text-white dark:bg-green-500'
                                    : 'bg-red-600 text-white dark:bg-red-500'
                                    }`}>
                                    {team.won ? 'Won' : 'Lost'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Game-by-Game Breakdown */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Game Breakdown
                </h2>
                <div className="space-y-4">
                    {seriesStats.games.map((game) => (
                        <div
                            key={game.sequenceNumber}
                            className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                        >
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                                Game {game.sequenceNumber}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {game.teams.map((team, idx) => (
                                    <div key={idx} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                                            {team.name}
                                        </h4>
                                        <div className="space-y-2 text-xs">
                                            {team.players.sort((a, b) => (b.kills / b.deaths) - (a.kills / a.deaths)).slice(0, 3).map((player) => (
                                                <div key={player.id} className="flex justify-between items-center">
                                                    <span className="text-zinc-600 dark:text-zinc-400 truncate">
                                                        {player.name}
                                                    </span>
                                                    <span className="text-zinc-900 dark:text-white font-semibold ml-2">
                                                        {player.kills}K / {player.deaths}D
                                                    </span>
                                                </div>
                                            ))}
                                            {team.players.length > 3 && (
                                                <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                                                    +{team.players.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
