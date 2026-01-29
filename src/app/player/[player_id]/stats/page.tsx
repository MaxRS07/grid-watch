'use client';

import { useState } from 'react';
import { usePlayerData } from '../PlayerDataContext';
import Link from 'next/link';
import { getEventActor, getEventTarget } from '@/lib/grid/seriesAnalysis';
import TimelineBar from '@/components/TimelineBar';
import ProgressBar from '@/components/ProgressBar';

export default function PlayerStatsPage() {
  const { player, playerStats, team, playerSeries, seriesEvents, loadedSeriesCount, status, seriesLoading, loading, error, timeWindow } = usePlayerData();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  const timeWindowLabels: Record<string, string> = {
    'WEEK': 'Last Week',
    'MONTH': 'Last Month',
    '3_MONTHS': 'Last 3 Months',
    '6_MONTHS': 'Last 6 Months',
    'YEAR': 'Last Year',
    'ALL': 'All Time',
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
  // wins array has 2 objects: one with value: true (wins), one with value: false (losses)

  const lossesEntry = playerStats.game.wins[0];
  const winsEntry = playerStats.game.wins[1];
  const totalWins = winsEntry.count;
  const avgWinPercentage = winsEntry.percentage;
  const bestStreak = winsEntry.streak.max;
  const worstStreak = lossesEntry.streak.max;

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {timeWindowLabels[timeWindow]} • Updated {player?.updatedAt ? new Date(player.updatedAt).toLocaleDateString() : 'N/A'}
      </div>

      {/* Team Card */}
      {team && player?.team.id && (
        <Link href={`/team/${player.team.id}`}>
          <div className="p-6 bg-linear-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-zinc-950 cursor-pointer" style={{ marginBottom: '24px' }}>
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

      {/* Series Event Timelines */}
      {playerSeries && playerSeries.length > 0 ?
        Object.entries(seriesEvents).length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Series Event Timeline
              </h2>
              <select
                value={selectedSeriesId || ''}
                onChange={(e) => setSelectedSeriesId(e.target.value || null)}
                className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a series...</option>
                {(() => {
                  const seriesNameCounts: Record<string, number> = {};
                  const seriesNameIndices: Record<string, number> = {};

                  // Count occurrences of each series name
                  playerSeries.forEach(series => {
                    const name = `${series.title?.name} - ${series.tournamentName}`;
                    seriesNameCounts[name] = (seriesNameCounts[name] || 0) + 1;
                  });

                  // Reset indices for mapping
                  Object.keys(seriesNameCounts).forEach(name => {
                    seriesNameIndices[name] = 0;
                  });

                  return playerSeries.map((series) => {
                    const name = `${series.title?.name} - ${series.tournamentName}`;
                    const count = seriesNameCounts[name];
                    seriesNameIndices[name]++;
                    const suffix = count > 1 ? ` - ${seriesNameIndices[name]}` : '';

                    return (
                      <option key={series.id} value={series.id}>
                        {name}{suffix}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>
            {selectedSeriesId && seriesEvents[selectedSeriesId] && (
              <div>
                {(() => {
                  const events = seriesEvents[selectedSeriesId];
                  const startEvent = events.find(e => e.type === "tournament-started-series");
                  const endEvent = events.find(e => e.type === "tournament-ended-series");
                  if (!startEvent || !endEvent) return null;
                  const series = playerSeries?.find(s => s.id === selectedSeriesId);
                  const filteredEvents = events.filter(e => {
                    const actor = getEventActor(e);
                    const target = getEventTarget(e);
                    return (actor && actor.id === player?.id || actor?.type === "game" || actor?.type === "series") || (target && target.id === player?.id);
                  });
                  const seriesName = series ? `${series.title?.name} - ${series.tournamentName}` : selectedSeriesId;
                  return (
                    <TimelineBar
                      events={[startEvent, ...filteredEvents, endEvent]}
                      seriesTeams={series?.teams.map(t => ({ id: t.baseInfo.id, name: t.baseInfo.name })) || []}
                      seriesId={selectedSeriesId}
                      seriesName={seriesName}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        ) :
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                No Series Data Available
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Series timelines will appear here when data is available
              </p>
            </div>
          </div>
        </div>}
    </div>
  );
}
