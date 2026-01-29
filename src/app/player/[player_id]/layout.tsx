'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { PlayerDataProvider, usePlayerData } from './PlayerDataContext';

function PlayerLayoutContent({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const playerId = params.player_id as string;
  const { player, loading, timeWindow, setTimeWindow } = usePlayerData();

  const isStatsActive = pathname?.includes('/stats');
  const isAnalysisActive = pathname?.includes('/analysis');
  const isSeriesActive = pathname?.includes('/series');

  const timeWindowOptions = [
    { label: '1W', value: 'WEEK' as const },
    { label: '1M', value: 'MONTH' as const },
    { label: '3M', value: '3_MONTHS' as const },
    { label: '6M', value: '6_MONTHS' as const },
    { label: '1Y', value: 'YEAR' as const },
    { label: 'ALL', value: 'ALL' as const },
  ];
  const navigateToStats = () => {
    router.push(`/player/${playerId}/stats`);
  };

  const navigateToAnalysis = () => {
    router.push(`/player/${playerId}/analysis`);
  };

  const navigateToSeries = () => {
    router.push(`/player/${playerId}/series`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/players')}
            className="mb-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Players
          </button>
          <h1 className='text-3xl'>
            {player ? player.name : 'Loading...'}
          </h1>
          <h1 className='text-xl mt-1'>
            {player ? player.title.name : ''}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            ID: {playerId}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-8 justify-between items-start">
            <div className="flex gap-8">
              <button
                onClick={navigateToStats}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${isStatsActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
              >
                Statistics
              </button>
              <button
                onClick={navigateToAnalysis}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${isAnalysisActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
              >
                Analysis
              </button>
              <button
                onClick={navigateToSeries}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${isSeriesActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
              >
                Series
              </button>
            </div>

            {/* Time Window Selector */}
            <div className="flex gap-2">
              {timeWindowOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeWindow(option.value)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${timeWindow === option.value
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

export default function PlayerLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const playerId = params.player_id as string;

  return (
    <PlayerDataProvider playerId={playerId}>
      <PlayerLayoutContent>{children}</PlayerLayoutContent>
    </PlayerDataProvider>
  );
}
