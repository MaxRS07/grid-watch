'use client';

import { usePlayerData } from '../PlayerDataContext';
import ProgressBar from '@/components/ProgressBar';
import { useEffect, useState, useRef } from 'react';
import { getPlayerAnalysisWithProgress, parseAnalysisResponse, type ParsedAnalysis } from '@/lib/gemini/analysis';
import { savePlayerReport, createPlayerReportRequest, getPlayerReport } from '@/lib/supabase/store';

export default function PlayerAnalysisPage() {
  const { player, playerStats, playerAnalysis, loading, error, timeWindow, playerSeries, seriesLoading, loadedSeriesCount, status } = usePlayerData();
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savingAnalysis, setSavingAnalysis] = useState<boolean>(false);
  const [cachedAnalysis, setCachedAnalysis] = useState<string | null>(null);
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const aiFetchAttemptedRef = useRef<boolean>(false);
  const analysisSavedRef = useRef<boolean>(false);

  const timeWindowLabels: Record<string, string> = {
    'WEEK': 'Last Week',
    'MONTH': 'Last Month',
    '3_MONTHS': 'Last 3 Months',
    '6_MONTHS': 'Last 6 Months',
    'YEAR': 'Last Year',
    'ALL': 'All Time',
  };

  useEffect(() => {
    // Abort any pending AI requests
    aiAbortControllerRef.current?.abort();

    // Reset all analysis state for new time window
    setAiAnalysis('');
    setParsedAnalysis(null);
    setAiLoading(false);
    setAiError(null);
    setCachedAnalysis(null);
    aiFetchAttemptedRef.current = false;
    analysisSavedRef.current = false;

    // Check if we have a cached report for this time window
    if (player) {
      getPlayerReport(player.id, timeWindow)
        .then((result) => {
          if (result.success && result.data?.report_text) {
            console.log('[Page] Found cached analysis for time window:', timeWindow);
            setCachedAnalysis(result.data.report_text);
            setAiAnalysis(result.data.report_text);
            setParsedAnalysis(parseAnalysisResponse(result.data.report_text));
          }
        })
        .catch((err) => {
          console.error('[Page] Failed to fetch cached report:', err);
        });
    }
  }, [timeWindow, player]);

  // Fetch AI analysis when player analysis is ready AND all series are loaded
  useEffect(() => {
    // Skip if we already have cached analysis
    if (cachedAnalysis) {
      console.log('[Page] Using cached analysis, skipping AI generation');
      return;
    }

    // Only attempt once per playerAnalysis change AND after all series are loaded
    if (playerAnalysis && !seriesLoading && !aiFetchAttemptedRef.current) {
      console.log(playerAnalysis)
      aiFetchAttemptedRef.current = true;
      setAiLoading(true);
      setAiError(null);
      setAiAnalysis(''); // Clear previous analysis

      // Create abort controller for this request
      aiAbortControllerRef.current = new AbortController();

      console.log('[Page] Starting AI analysis fetch...');

      getPlayerAnalysisWithProgress(playerAnalysis, ({ text, chunksReceived }) => {
        console.log(`[Page] Received chunk ${chunksReceived}: ${text.length} characters total`);
        // Update state with the accumulated text
        setAiAnalysis(text);
        // Parse the response as it streams in
        setParsedAnalysis(parseAnalysisResponse(text));
        // Keep loading true as long as we're receiving chunks
        setAiLoading(text.length < 100); // Consider done when we have significant content
      })
        .then(() => {
          console.log('[Page] AI analysis complete');
          setAiLoading(false);
        })
        .catch((err) => {
          // Don't show error if request was aborted
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('[Page] AI analysis request cancelled');
            return;
          }
          console.error('[Page] Failed to generate AI analysis:', err);
          setAiError(err instanceof Error ? err.message : 'Failed to generate analysis');
          setAiLoading(false);
        });
    }

    // Cleanup on unmount
    return () => {
      aiAbortControllerRef.current?.abort();
    };
  }, [playerAnalysis, seriesLoading, cachedAnalysis]);

  // Save analysis to Supabase once complete
  useEffect(() => {
    if (!aiAnalysis || !player || aiLoading || analysisSavedRef.current || !playerSeries || seriesLoading) {
      return;
    }

    analysisSavedRef.current = true;
    setSavingAnalysis(true);

    const lastSeriesDate = playerSeries.length > 0
      ? playerSeries[0].startTimeScheduled.split('T')[0]
      : new Date().toISOString().split('T')[0];

    const reportRequest = createPlayerReportRequest(
      player.id,
      timeWindow,
      aiAnalysis,
      playerSeries.length,
      lastSeriesDate
    );

    savePlayerReport(reportRequest)
      .then((result) => {
        if (result.success) {
          console.log('[Page] Analysis saved to Supabase');
        } else {
          console.log('[Page] Failed to save analysis:', result.error);
        }
      })
      .catch((err) => {
        console.log('[Page] Error saving analysis:', err);
      })
      .finally(() => {
        setSavingAnalysis(false);
      });
  }, [aiAnalysis, player, playerSeries, aiLoading, seriesLoading]);

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
        {savingAnalysis && (
          <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            Saving analysis...
          </div>
        )}
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

      {/* Trend Analysis */}
      {!seriesLoading && playerAnalysis && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Trend Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Within Game Trend</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
                  {playerAnalysis.trends.roundPerformanceTrend}
                </p>
                <span className={`text-2xl ${playerAnalysis.trends.roundPerformanceTrend === 'improving' ? 'text-green-600 dark:text-green-400' :
                  playerAnalysis.trends.roundPerformanceTrend === 'declining' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                  {playerAnalysis.trends.roundPerformanceTrend === 'improving' ? '📈' :
                    playerAnalysis.trends.roundPerformanceTrend === 'declining' ? '📉' : '➡️'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Correlation: {playerAnalysis.trends.roundPerformanceTrendValue.toFixed(3)}
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Series Trend</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
                  {playerAnalysis.trends.gamePerformanceTrend}
                </p>
                <span className={`text-2xl ${playerAnalysis.trends.gamePerformanceTrend === 'improving' ? 'text-green-600 dark:text-green-400' :
                  playerAnalysis.trends.gamePerformanceTrend === 'declining' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                  {playerAnalysis.trends.gamePerformanceTrend === 'improving' ? '📈' :
                    playerAnalysis.trends.gamePerformanceTrend === 'declining' ? '📉' : '➡️'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Correlation: {playerAnalysis.trends.gamePerformanceTrendValue.toFixed(3)}
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Consistency Score</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {(playerAnalysis.trends.consistencyScore * 100).toFixed(1)}%
              </p>
              <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                  style={{ width: `${playerAnalysis.trends.consistencyScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series Performance */}
      {!seriesLoading && playerAnalysis && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Series Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Overall Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Games Played</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Games Won</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.gamesWon} ({(playerAnalysis.seriesTrends.winRate * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Kills</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.totalKills}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Deaths</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.totalDeaths}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Per-Game Averages</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg Kills/Game</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.avgKillsPerGame.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg Deaths/Game</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.avgDeathsPerGame.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg Damage/Game</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.avgDamagePerGame.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Damage Dealt</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{playerAnalysis.seriesTrends.totalDamageDealt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {!seriesLoading && (
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
              {parsedAnalysis && parsedAnalysis.strengths.length > 0 && (
                parsedAnalysis.strengths.map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2" />
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{strength}</p>
                  </div>
                ))
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
              {parsedAnalysis && parsedAnalysis.weaknesses.length > 0 && (
                parsedAnalysis.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2" />
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{weakness}</p>
                  </div>
                ))
              )}
            </div>
          </div >
        </div >
      )}
      {/* AI Scouting Insights */}
      {!seriesLoading && (
        < div className="p-6 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900" >
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Scouting Report
          </h2>

          {aiLoading && (
            <div className="space-y-3">
              <p className="text-zinc-600 dark:text-zinc-400">
                {aiAnalysis.length > 0
                  ? `Generating analysis... (${aiAnalysis.length} characters)`
                  : 'Generating detailed analysis...'}
              </p>
              {aiAnalysis.length === 0 && (
                <div className="space-y-2">
                  <div className="h-4 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse" />
                  <div className="h-4 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse w-4/6" />
                </div>
              )}
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-red-600 dark:text-red-400">
                <span className="font-semibold">Error generating analysis:</span> {aiError}
              </p>
            </div>
          )}

          {aiAnalysis && (
            <div className="space-y-4">
              {parsedAnalysis?.overview && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                    {parsedAnalysis.overview}
                  </p>
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <details className="cursor-pointer">
                  <summary className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">
                    View full analysis
                  </summary>
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                </details>
              </div>
            </div>
          )}

          {!aiAnalysis && !aiLoading && !aiError && !playerAnalysis && (
            <p className="text-zinc-600 dark:text-zinc-400">
              Load series data to generate AI analysis...
            </p>
          )}
        </div >
      )}
    </div >
  );
}
