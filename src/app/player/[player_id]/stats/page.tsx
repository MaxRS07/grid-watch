'use client';

import { usePlayerData } from '../PlayerDataContext';
import Link from 'next/link';

export default function PlayerStatsPage() {
  const { player, playerStats, team, loading, error, timeWindow } = usePlayerData();

  const timeWindowLabels: Record<string, string> = {
    'WEEK': 'Last Week',
    'MONTH': 'Last Month',
    '3_MONTHS': 'Last 3 Months',
    '6_MONTHS': 'Last 6 Months',
    'YEAR': 'Last Year',
  };

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

  if (!playerStats) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-900 dark:text-white">No statistics found for this player.</p>
      </div>
    );
  }

  // Calculate aggregate wins statistics from the wins array
  const totalWins = playerStats.game.wins.reduce((sum, w) => sum + w.value, 0);
  const totalWinGames = playerStats.game.wins.reduce((sum, w) => sum + w.count, 0);
  const avgWinPercentage = playerStats.game.wins.length > 0
    ? playerStats.game.wins.reduce((sum, w) => sum + w.percentage, 0) / playerStats.game.wins.length
    : 0;
  const bestStreak = Math.max(...playerStats.game.wins.map(w => w.streak.max), 0);
  const worstStreak = Math.min(...playerStats.game.wins.map(w => w.streak.min), 0);

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {timeWindowLabels[timeWindow]} • Updated {player?.updatedAt ? new Date(player.updatedAt).toLocaleDateString() : 'N/A'}
      </div>

      {/* Team Card */}
      {team && player?.teamId && (
        <Link href={`/team/${player.teamId}`}>
          <div className="p-6 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-zinc-950 cursor-pointer" style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {team.logoUrl && (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Team</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                    {team.name}
                  </h3>
                </div>
              </div>
              <svg
                className="w-6 h-6 text-zinc-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Game Stats Overview */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
          Game Performance Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Games Played</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {playerStats.game.count}
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

      {/* Wins Breakdown */}
      {playerStats.game.wins && playerStats.game.wins.length > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Wins Breakdown
          </h2>
          <div className="space-y-4">
            {playerStats.game.wins.map((win, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Wins</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {win.value}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Games</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {win.count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Win Rate</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {win.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Current Streak</p>
                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {win.streak.current}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Best Streak</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {win.streak.max}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Series Stats */}
      {playerStats.series && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Series Performance
          </h2>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Series Count</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {playerStats.series.count}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Kills</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {playerStats.series.kills.sum}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Avg Kills</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {playerStats.series.kills.avg.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Min Kills</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {playerStats.series.kills.min}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Max Kills</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {playerStats.series.kills.max}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment Stats */}
      {playerStats.segment && playerStats.segment.length > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Segment Statistics
          </h2>
          <div className="space-y-4">
            {playerStats.segment.map((seg, idx) => (
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
    </div>
  );
}
