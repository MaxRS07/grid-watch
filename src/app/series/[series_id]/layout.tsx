'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { SeriesDataProvider, useSeriesData } from './SeriesDataContext';

function SeriesLayoutContent({ children }: { children: ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const seriesId = params.series_id as string;
    const { series, seriesStats, loading } = useSeriesData();

    const isStatsActive = pathname?.includes('/stats');
    const isAnalysisActive = pathname?.includes('/analysis');
    const isTimelineActive = pathname?.includes('/timeline');

    const navigateToStats = () => {
        router.push(`/series/${seriesId}/stats`);
    };

    const navigateToAnalysis = () => {
        router.push(`/series/${seriesId}/analysis`);
    };

    const navigateToTimeline = () => {
        router.push(`/series/${seriesId}/timeline`);
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header with back button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/series')}
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
                        Back to Matches
                    </button>
                    <h1 className='text-3xl'>
                        {series ? series.title.name + " " + series.tournamentName : 'Loading...'}
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Format: {seriesStats?.format || 'N/A'} • Status: {seriesStats?.finished ? 'Finished' : seriesStats?.started ? 'Live' : 'Scheduled'} • ID: {seriesId}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
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
                            onClick={navigateToTimeline}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${isTimelineActive
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                {children}
            </div>
        </div>
    );
}

export default function SeriesLayout({ children }: { children: ReactNode }) {
    const params = useParams();
    const seriesId = params.series_id as string;

    return (
        <SeriesDataProvider seriesId={seriesId}>
            <SeriesLayoutContent>{children}</SeriesLayoutContent>
        </SeriesDataProvider>
    );
}
