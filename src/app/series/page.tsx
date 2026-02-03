'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar, { FilterOption } from '@/components/SearchBar';
import SeriesCard from '@/components/SeriesCard';
import { Series, Team } from '@/data/allData';
import { fetchSeriesWithFilters, SeriesProps } from '@/lib/grid/series';
import { fetchTeamById } from '@/lib/grid/teams';

export default function SeriesPage() {
    const [allSeries, setAllSeries] = useState<Series[]>([]);
    const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
    const [teamMap, setTeamMap] = useState<Record<string, Team>>({}); // Store fetched teams
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [afterCursor, setAfterCursor] = useState<string | null>(null);
    const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null as string | null });
    const pageSize = 20;

    const defaultEnd = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const [filters, setFilters] = useState<FilterOption[]>([
        { id: 'startDate', label: 'Start Date', type: 'date', value: Date.now() },
        { id: 'endDate', label: 'End Date', type: 'date', value: defaultEnd },
        { id: 'teamId', label: 'Team', type: 'text', value: '', placeholder: 'Team ID' },
        { id: 'titleId', label: 'Title', type: 'text', value: '', placeholder: 'Title ID' },
        { id: 'playerId', label: 'Player', type: 'text', value: '', placeholder: 'Player ID' },
        {
            id: 'live', label: 'Live Only', type: 'select', value: '', options: [
                { label: 'All', value: '' },
                { label: 'Live', value: 'true' },
                { label: 'Scheduled', value: 'false' }
            ]
        },
    ]);

    const router = useRouter();

    useEffect(() => {
        const seriesFilters: SeriesProps = {};

        // Add start date if set
        const startDateFilter = filters.find(f => f.id === 'startDate');
        if (startDateFilter?.value) {
            seriesFilters.startDate = startDateFilter.value as number;
        }

        // Add end date if set
        const endDateFilter = filters.find(f => f.id === 'endDate');
        if (endDateFilter?.value) {
            seriesFilters.endDate = endDateFilter.value as number;
        }

        // Add team ID if set
        const teamFilter = filters.find(f => f.id === 'teamId');
        if (teamFilter?.value) {
            seriesFilters.teamId = teamFilter.value as string;
        }

        // Add title ID if set
        const titleFilter = filters.find(f => f.id === 'titleId');
        if (titleFilter?.value) {
            seriesFilters.titleId = titleFilter.value as string;
        }

        // Add player ID if set
        const playerFilter = filters.find(f => f.id === 'playerId');
        if (playerFilter?.value) {
            seriesFilters.livePlayerIds = playerFilter.value as string[];
        }

        // Add live filter if set
        const liveFilter = filters.find(f => f.id === 'live');
        if (liveFilter?.value) {
            seriesFilters.live = liveFilter.value === 'true';
        }

        // Add pagination
        seriesFilters.first = pageSize;
        seriesFilters.after = afterCursor;

        fetchSeriesWithFilters(seriesFilters)
            .then(async (seriesData) => {
                const series = seriesData.data || [];
                setAllSeries(series);
                setFilteredSeries(series);
                setPageInfo(seriesData.pageInfo);

                // Fetch team data for all teams in the series
                const teamIds = new Set<string>();
                series.forEach(s => {
                    s.teams?.forEach(t => {
                        if (t.baseInfo?.id) teamIds.add(t.baseInfo.id);
                    });
                });

                const teams: Record<string, Team> = {};
                const teamPromises = Array.from(teamIds).map(teamId =>
                    fetchTeamById(teamId)
                        .then(team => {
                            teams[team.id] = team;
                        })
                        .catch(err => {
                            console.warn(`Failed to fetch team ${teamId}:`, err);
                        })
                );

                await Promise.all(teamPromises);
                setTeamMap(teams);
            })
            .catch((err) => {
                console.error('Error fetching series:', err);
            })
            .finally(() => setLoading(false));
    }, [filters, afterCursor]);

    // Apply all filters whenever search query or filter values change
    useEffect(() => {
        applyAllFilters();
    }, [searchQuery, filters, allSeries]);

    const applyAllFilters = () => {
        let filtered = allSeries;

        // Apply search filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((series) => {
                const titleMatch = series.tournamentName?.toLowerCase().includes(lowerQuery);
                const tournamentMatch = series.tournamentName?.toLowerCase().includes(lowerQuery);
                const teamMatch = series.teams?.some(team =>
                    team.baseInfo?.name?.toLowerCase().includes(lowerQuery)
                );
                return titleMatch || tournamentMatch || teamMatch;
            });
        }

        // Apply date filters
        const startDateFilter = filters.find(f => f.id === 'startDate');
        const endDateFilter = filters.find(f => f.id === 'endDate');

        if (startDateFilter?.value) {
            const start = new Date(startDateFilter.value as number);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter((s) =>
                new Date(s.startTimeScheduled) >= start
            );
        }

        if (endDateFilter?.value) {
            const end = new Date(endDateFilter.value as number);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((s) =>
                new Date(s.startTimeScheduled) <= end
            );
        }

        setFilteredSeries(filtered);
    };

    const handleFilterChange = (filterId: string, value: string | string[] | number) => {
        setFilters((prev) =>
            prev.map((f) =>
                f.id === filterId ? { ...f, value } : f
            )
        );
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setAfterCursor(null);
        setPageInfo({ hasNextPage: false, endCursor: null });
        setFilters((prev) =>
            prev.map((f) => {
                if (f.id === 'startDate') {
                    return { ...f, value: Date.now() };
                } else if (f.id === 'endDate') {
                    return { ...f, value: defaultEnd };
                } else {
                    return { ...f, value: '' };
                }
            })
        );
    };

    const handleRouting = (seriesId: string) => {
        router.push(`/series/${seriesId}`);
    };

    if (loading)
        return <p className="text-center mt-20">Loading matches...</p>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
                    Upcoming Matches
                </h1>

                <SearchBar
                    placeholder="Search matches by name, tournament, or team..."
                    filters={filters}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    results={filteredSeries}
                />

                <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Showing {filteredSeries.length} of {allSeries.length} matches
                </div>

                {filteredSeries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            No matches found matching your criteria.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 mt-6">
                        {filteredSeries.map((series) => {
                            const seriesYear = new Date(series.startTimeScheduled).getFullYear();
                            return (
                                <SeriesCard
                                    key={series.id}
                                    id={series.id}
                                    title={series.title?.name || series.tournamentName || 'Unknown Series'}
                                    tournament={series.tournamentName || 'Unknown Tournament'}
                                    startTime={series.startTimeScheduled}
                                    format={series.format?.nameShortened || series.format?.name || ''}
                                    year={seriesYear}
                                    teams={series.teams?.map(t => {
                                        const teamId = t.baseInfo?.id || '';
                                        const teamData = teamMap[teamId];
                                        return {
                                            id: teamId,
                                            name: t.baseInfo?.name || 'TBD',
                                            scoreAdvantage: t.scoreAdvantage || 0,
                                            colorPrimary: teamData?.colorPrimary,
                                            colorSecondary: teamData?.colorSecondary,
                                            logoUrl: teamData?.logoUrl
                                        };
                                    }) || []}
                                    onClick={handleRouting}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredSeries.length > 0 && (
                    <div
                        className="mt-8 flex items-center justify-between"
                        style={{ paddingInline: "10%" }}
                    >
                        <button
                            onClick={() => setAfterCursor(null)}
                            disabled={!afterCursor}
                            className="px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                            First
                        </button>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {filteredSeries.length} results
                        </span>
                        <button
                            onClick={() => setAfterCursor(pageInfo.endCursor)}
                            disabled={!pageInfo.hasNextPage || !pageInfo.endCursor}
                            className="px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
