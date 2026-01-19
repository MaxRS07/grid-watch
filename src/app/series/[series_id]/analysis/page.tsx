'use client';

import { useSeriesData } from '../SeriesDataContext';

export default function SeriesAnalysisPage() {
    const { series, seriesStats, teams, loading, error } = useSeriesData();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading analysis...</p>
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
                <p className="text-zinc-900 dark:text-white">No data available for analysis.</p>
            </div>
        );
    }

    // Create team map for quick lookup by name
    const teamMap = new Map(teams.map(t => [t.name, t]));

    // Calculate aggregate statistics across all games with team association
    const allPlayers = new Map<string, {
        name: string;
        totalKills: number;
        totalDeaths: number;
        totalAssists: number;
        gamesPlayed: number;
        teamId: string;
        teamName: string;
        teamColorPrimary: string;
        teamColorSecondary: string;
    }>();

    seriesStats.games.forEach(game => {
        game.teams.forEach(team => {
            const teamData = teamMap.get(team.name);
            team.players.forEach(player => {
                const existing = allPlayers.get(player.id) || {
                    name: player.name,
                    totalKills: 0,
                    totalDeaths: 0,
                    totalAssists: 0,
                    gamesPlayed: 0,
                    teamId: team.id,
                    teamName: team.name,
                    teamColorPrimary: teamData?.colorPrimary || '#3b82f6',
                    teamColorSecondary: teamData?.colorSecondary || '#1e40af',
                };
                existing.totalKills += player.kills;
                existing.totalDeaths += player.deaths;
                existing.totalAssists += player.killAssistsGiven;
                existing.gamesPlayed += 1;
                allPlayers.set(player.id, existing);
            });
        });
    });

    const playerStats = Array.from(allPlayers.values())
        .sort((a, b) => b.totalKills - a.totalKills)
        .slice(0, 10);

    const avgKda = playerStats.length > 0
        ? playerStats.reduce((sum, p) => sum + (p.totalKills / Math.max(1, p.totalDeaths)), 0) / playerStats.length
        : 0;

    return (
        <div className="space-y-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Series Analysis • {seriesStats.games.length} Games
            </div>

            {/* Key Statistics */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Series Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg K/D Ratio</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {avgKda.toFixed(2)}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Players</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {allPlayers.size}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Series Winner</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {teams.find(t => t.won)?.name || 'TBD'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Top Performers
                </h2>
                <div className="space-y-3">
                    {playerStats.map((player, idx) => {
                        const kda = (player.totalKills / Math.max(1, player.totalDeaths)).toFixed(2);
                        return (
                            <div
                                key={player.name}
                                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between border-l-4 transition-all hover:shadow-md"
                                style={{ borderLeftColor: player.teamColorPrimary }}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg font-bold ${idx === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                                            idx === 1 ? 'text-gray-600 dark:text-gray-400' :
                                                idx === 2 ? 'text-orange-600 dark:text-orange-400' :
                                                    'text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                            #{idx + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-900 dark:text-white font-semibold">
                                                {player.name}
                                            </span>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: player.teamColorPrimary }}>
                                            {player.teamName}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 ml-7">
                                        {player.gamesPlayed} games
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {player.totalKills}K / {player.totalDeaths}D
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        KDA: {kda}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Team Performance Comparison */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Team Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => {
                        console.log(allPlayers);
                        const teamPlayerStats = Array.from(allPlayers.values())
                            .filter(p => p.teamId === team.id)
                            .sort((a, b) => b.totalKills - a.totalKills);
                        const totalTeamKills = teamPlayerStats.reduce((sum, p) => sum + p.totalKills, 0);
                        const totalTeamDeaths = teamPlayerStats.reduce((sum, p) => sum + p.totalDeaths, 0);
                        const totalTeamAssists = teamPlayerStats.reduce((sum, p) => sum + p.totalAssists, 0);
                        const avgTeamKD = totalTeamDeaths > 0 ? (totalTeamKills / totalTeamDeaths).toFixed(2) : totalTeamKills.toFixed(2);
                        return (
                            <div
                                key={team.id}
                                className="p-6 rounded-xl border-2 transition-all hover:shadow-md"
                                style={{
                                    backgroundColor: `${team.colorPrimary}15`,
                                    borderColor: team.colorPrimary,
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {team.logoUrl && (
                                            <img
                                                src={team.logoUrl}
                                                alt={team.name}
                                                className="w-10 h-10 object-contain"
                                            />
                                        )}
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                                            {team.name}
                                        </h3>
                                    </div>
                                    <span
                                        className="px-3 py-1 rounded-lg font-bold text-sm text-white"
                                        style={{ backgroundColor: team.won ? '#22c55e' : '#ef4444' }}
                                    >
                                        {team.won ? 'Winner' : 'Loser'}
                                    </span>
                                </div>

                                {/* Team Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Kills</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{totalTeamKills}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Deaths</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{totalTeamDeaths}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">K/D Ratio</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{avgTeamKD}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Assists</p>
                                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalTeamAssists}</p>
                                    </div>
                                </div>

                                {/* Team Players */}
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Players ({teamPlayerStats.length})</p>
                                    <div className="space-y-2">
                                        {teamPlayerStats.filter(p => p.teamId === team.id).map((p) => {
                                            return (
                                                <div key={p.name} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-zinc-800 rounded">
                                                    <span className="text-zinc-900 dark:text-white font-medium">{p.name}</span>
                                                    <span className="text-zinc-600 dark:text-zinc-400">
                                                        {p.totalKills}K / {p.totalDeaths}D
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
