'use client';

import { usePlayerData } from '../PlayerDataContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Series } from '@/data/allData';
import { fetchSeriesWithFilters } from '@/lib/grid/series';

export default function PlayerSeriesPage() {
    const { player, loading, error, timeWindow } = usePlayerData();
    const [playerSeries, setPlayerSeries] = useState<Series[]>([]);
    const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
    const [seriesLoading, setSeriesLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const timeWindowMillis: Record<string, number> = {
        'WEEK': 7 * 24 * 60 * 60 * 1000,
        'MONTH': 30 * 24 * 60 * 60 * 1000,
        '3_MONTHS': 90 * 24 * 60 * 60 * 1000,
        '6_MONTHS': 180 * 24 * 60 * 60 * 1000,
        'YEAR': 365 * 24 * 60 * 60 * 1000,
        'ALL': 10 * 365 * 24 * 60 * 60 * 1000,
    };

    // Fetch series for this player
    useEffect(() => {
        if (!player?.id) return;

        setSeriesLoading(true);
        fetchSeriesWithFilters({
            livePlayerIds: [player.id],
            startDate: Date.now() - timeWindowMillis[timeWindow],
            endDate: Date.now()
        })
            .then(series => {
                setPlayerSeries(series);
                setFilteredSeries(series);
            })
            .catch(err => console.error('Error fetching player series:', err))
            .finally(() => setSeriesLoading(false));
    }, [player?.id]);

    // Apply date filters
    useEffect(() => {
        let filtered = playerSeries;

        if (startDate) {
            const start = new Date(startDate).getTime();
            filtered = filtered.filter(s => new Date(s.startTimeScheduled).getTime() >= start);
        }

        if (endDate) {
            const end = new Date(endDate).getTime();
            filtered = filtered.filter(s => new Date(s.startTimeScheduled).getTime() <= end);
        }

        setFilteredSeries(filtered);
    }, [playerSeries, startDate, endDate]);

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    if (loading || seriesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-zinc-900 dark:text-white">Loading series data...</p>
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

    return (
        <>
            {/* Filters */}
            <div className="mb-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
                >
                    Reset Filters
                </button>
            </div>

            {/* Series Cards */}
            {!playerSeries || playerSeries.length === 0 ? (
                <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-600 dark:text-yellow-400">
                        No series data available for this player.
                    </p>
                </div>
            ) : filteredSeries.length === 0 ? (
                <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-600 dark:text-yellow-400">
                        No series match the selected filters.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSeries.map((series) => {
                        const seriesDate = new Date(series.startTimeScheduled);
                        const formattedDate = seriesDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        });
                        const formattedTime = seriesDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                        });

                        return (
                            <Link key={series.id} href={`/series/${series.id}`}>
                                <div className="p-6 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-zinc-950 cursor-pointer" style={{ marginBottom: '24px' }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                                {series.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm">
                                                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                    {formattedDate} at {formattedTime}
                                                </span>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Format</p>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                                {series.format?.name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Tournament</p>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                                {series.tournamentName || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Teams</p>
                                        <div className="flex items-center gap-2">
                                            {series.teams.map((team, idx) => (
                                                <div key={team.baseInfo.id} className="flex items-center">
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                                        {team.baseInfo.name}
                                                    </span>
                                                    {idx < series.teams.length - 1 && (
                                                        <span className="mx-2 text-zinc-400">vs</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}
