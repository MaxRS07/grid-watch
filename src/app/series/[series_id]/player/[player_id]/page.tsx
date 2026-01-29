'use client';

import { useParams } from 'next/navigation';
import { useSeriesData } from '../../SeriesDataContext';
import Link from 'next/link';
import { encode } from 'punycode';

export default function SeriesPlayerDetailPage() {
    const params = useParams();
    const playerId = params.player_id as string;
    const { series, seriesStats, teams } = useSeriesData();

    const baseWikiURL = (series?.id === "3") ? 'https://wiki.leagueoflegends.com/en-us/' : 'https://valorant.fandom.com/wiki/';

    if (!seriesStats) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading player data...</p>
            </div>
        );
    }

    // Find player across all games
    let playerData: any = null;
    let playerTeam: any = null;

    for (const game of seriesStats.games) {
        for (const team of game.teams) {
            const player = team.players.find(p => p.id === playerId);
            if (player) {
                playerData = player;
                playerTeam = teams.find(t => t.id === team.id);
                break;
            }
        }
        if (playerData) break;
    }

    if (!playerData) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-900 dark:text-white">Player not found in this series.</p>
            </div>
        );
    }

    const kda = (playerData.kills / Math.max(1, playerData.deaths)).toFixed(2);
    const netWorthK = (playerData.netWorth / 1000).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href={`/series/${params.series_id}/analysis`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    ← Back to Series
                </Link>
            </div>

            {/* Player Header Card */}
            <div className="p-6 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Player</p>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                            {playerData.name}
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            ID: {playerData.id}
                        </p>
                    </div>
                    {playerTeam && (
                        <div className="text-right">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Team</p>
                            <p className="text-lg font-bold" style={{ color: playerTeam.colorPrimary }}>
                                {playerTeam.name}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Combat Stats */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Combat Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Kills</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {playerData.kills}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Deaths</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {playerData.deaths}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">K/D Ratio</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {kda}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Kill Assists</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {playerData.killAssistsGiven}
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Team Kills</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {playerData.teamkills}
                        </p>
                    </div>
                </div>
            </div>

            {/* Economy Stats */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                    Economy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Net Worth</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${netWorthK}K
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Current Money</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${(playerData.money / 1000).toFixed(1)}K
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Loadout Value</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${(playerData.loadoutValue / 1000).toFixed(1)}K
                        </p>
                    </div>
                </div>
            </div>

            {/* Character Info */}
            {playerData.character && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Character
                    </h2>
                    <a target='_blank' href={baseWikiURL + encodeURI(playerData.character.name.replace(' ', '_'))}>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Character Name</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                {playerData.character.name}
                            </p>
                        </div>
                    </a>
                </div>
            )}

            {/* Weapon Kills */}
            {playerData.weaponKills && playerData.weaponKills.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Weapon Breakdown
                    </h2>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2" style={{ paddingInline: '10px' }}>
                            <span className='text-lg font-bold text-gray-600'>
                                Name
                            </span>
                            <span className='text-lg font-bold text-gray-600'>
                                Kills
                            </span>
                        </div>
                        {playerData.weaponKills
                            .sort((a: any, b: any) => b.count - a.count)
                            .map((weapon: any, idx: number) => (
                                <a key={weapon.id} href={baseWikiURL + encodeURI(weapon.weaponName.replace(' ', '_'))} target='_blank'>
                                    <div
                                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between"
                                        style={{ marginBottom: '10px' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 w-6">
                                                #{idx + 1}
                                            </span>
                                            <span className="text-zinc-900 dark:text-white font-medium">
                                                {weapon.weaponName}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {weapon.count}
                                        </span>
                                    </div>
                                </a>
                            ))}
                    </div>
                </div>
            )}

            {/* Abilities */}
            {playerData.abilities && playerData.abilities.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Abilities
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {playerData.abilities.map((ability: any) => (
                            <a key={ability.id} href={baseWikiURL + encodeURI(ability.name.replace(' ', '_'))} target='_blank'>
                                <div
                                    className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between"
                                >
                                    <span className="text-zinc-900 dark:text-white font-medium">
                                        {ability.name}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded text-xs font-bold ${ability.ready
                                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        {ability.ready ? 'Ready' : 'On Cooldown'}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Inventory */}
            {playerData.inventory && playerData.inventory.items && playerData.inventory.items.length > 0 && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Inventory
                    </h2>
                    <div className="space-y-2">
                        {playerData.inventory.items
                            .filter((item: any) => item.quantity > 0 || item.stashed > 0 || item.equipped > 0)
                            .map((item: any) => (
                                <a key={item.id} href={baseWikiURL + encodeURI(item.name.replace(' ', '_'))} target='_blank'>
                                    <div
                                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                                        style={{ marginBottom: '10px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-900 dark:text-white font-medium">
                                                {item.name}
                                            </span>
                                            <div className="flex gap-4 text-sm">
                                                {item.equipped > 0 && (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        Equipped: {item.equipped}
                                                    </span>
                                                )}
                                                {item.quantity > 0 && (
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        Inv: {item.quantity}
                                                    </span>
                                                )}
                                                {item.stashed > 0 && (
                                                    <span className="text-purple-600 dark:text-purple-400">
                                                        Stash: {item.stashed}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                    </div>
                </div>
            )}

            {/* Position */}
            {playerData.position && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Position
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">X</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                {playerData.position.x.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Y</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                {playerData.position.y.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
