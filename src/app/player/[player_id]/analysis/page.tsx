'use client';

import { usePlayerData } from '../PlayerDataContext';
import ProgressBar from '@/components/ProgressBar';

export default function PlayerAnalysisPage() {
  const { player, playerStats, loading, error, timeWindow, playerSeries, seriesLoading, loadedSeriesCount, status } = usePlayerData();

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

  if (!playerStats) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-900 dark:text-white">No data available for analysis.</p>
      </div>
    );
  }
  const totalGames = playerStats.game.count;
  const avgWinPercentage = playerStats.game.wins.length > 0
    ? playerStats.game.wins.reduce((sum, w) => sum + w.percentage, 0) / playerStats.game.wins.length
    : 0;

  const totalKills = playerStats.series.kills.sum;
  const totalSeries = playerStats.series.count;
  const avgKillsPerSeries = totalSeries > 0 ? totalKills / totalSeries : 0;

  const totalDeaths = playerStats.segment.reduce((sum, seg) => sum + seg.deaths.sum, 0);
  const avgDeathsPerGame = totalGames > 0 ? totalDeaths / totalGames : 0;

  const kdRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Performance Analysis • {timeWindowLabels[timeWindow]} • Updated {player?.updatedAt ? new Date(player.updatedAt).toLocaleDateString() : 'N/A'}
      </div>

      {/* Loading Progress */}
      {seriesLoading && playerSeries && playerSeries.length > 0 && (
        <ProgressBar
          current={loadedSeriesCount}
          total={playerSeries.length}
          label={status || "Loading series data..."}
          isLoading={seriesLoading}
          status={status}
        />
      )}

      {/* Key Metrics */}
      < div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" >
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">K/D Ratio</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {kdRatio.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              {totalKills} kills / {totalDeaths} deaths
            </p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg Kills/Series</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {avgKillsPerSeries.toFixed(1)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Across all series played
            </p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg Deaths/Game</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {avgDeathsPerGame.toFixed(1)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Lower is better
            </p>
          </div>
        </div>
      </div >

      {/* Strengths & Weaknesses */}
      < div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
        {/* Strengths */}
        < div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" >
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Strengths
          </h2>
          <div className="space-y-3">
            {avgWinPercentage > 50 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">High Win Rate</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {avgWinPercentage.toFixed(1)}% win rate is above average
                  </p>
                </div>
              </div>
            )}
            {kdRatio > 1.2 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Positive K/D</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Consistently getting more kills than deaths
                  </p>
                </div>
              </div>
            )}
            {avgKillsPerSeries > 15 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Strong Fragging</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    High average kills per series
                  </p>
                </div>
              </div>
            )}
            {playerStats.game.wins.some(w => w.streak.max > 3) && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Consistency</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Capable of maintaining win streaks
                  </p>
                </div>
              </div>
            )}
          </div>
        </div >

        {/* Areas for Improvement */}
        < div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" >
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Areas for Improvement
          </h2>
          <div className="space-y-3">
            {avgWinPercentage <= 50 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Win Rate</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Focus on improving game sense and decision-making
                  </p>
                </div>
              </div>
            )}
            {kdRatio < 1.0 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">K/D Ratio</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Work on positioning and survival
                  </p>
                </div>
              </div>
            )}
            {avgDeathsPerGame > 12 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Deaths</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Reduce unnecessary deaths through better awareness
                  </p>
                </div>
              </div>
            )}
            {avgKillsPerSeries < 10 && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Impact</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Increase fragging potential through aim practice
                  </p>
                </div>
              </div>
            )}
          </div>
        </div >
      </div >

      {/* Recommendations */}
      < div className="p-6 bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-900" >
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommendations
        </h2>
        <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Review your highest-performing series to identify successful patterns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Focus on consistency - maintaining performance across all game segments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Analyze your deaths to identify common mistakes and improve positioning</span>
          </li>
        </ul>
      </div >

      {/* AI Scouting Insights */}
      < div className="p-6 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900" >
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Scouting Report
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Advanced analytics and AI-powered insights coming soon. This section will provide:
        </p>
        <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
            <span>Playstyle analysis and player tendencies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
            <span>Predictive performance metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
            <span>Comparative analysis against team/league averages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
            <span>Machine learning-based scouting recommendations</span>
          </li>
        </ul>
      </div >
    </div >
  );
}
