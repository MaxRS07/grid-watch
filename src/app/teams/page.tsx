'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar, { FilterOption } from '@/components/SearchBar';
import TeamCard from '@/components/TeamCard';
import { Team } from '@/data/allData';
import { fetchTeams, searchTeamsByName } from '@/lib/grid/teams';

export default function TeamsPage() {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  // Initialize filters
  useEffect(() => {
    setFilters([
      {
        id: 'name',
        label: 'Team Name',
        type: 'text',
        value: '',
        placeholder: 'Filter by team name',
      },
    ]);
  }, []);

  // Fetch teams from API
  useEffect(() => {
    fetchTeams(48)
      .then((response) => {
        setAllTeams(response.data);
        setFilteredTeams(response.data);
        setHasNextPage(response.pageInfo.hasNextPage);
        setNextCursor(response.pageInfo.endCursor);
      })
      .catch((error) => {
        console.error('Error fetching teams:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchTeams(48, nextCursor);
      setAllTeams((prev) => [...prev, ...response.data]);
      setFilteredTeams((prev) => [...prev, ...response.data]);
      setHasNextPage(response.pageInfo.hasNextPage);
      setNextCursor(response.pageInfo.endCursor);
    } catch (error) {
      console.error('Error loading more teams:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is empty, show all teams
      setFilteredTeams(allTeams);
      return;
    }

    try {
      // Search via API
      const response = await searchTeamsByName(query, 48);
      setFilteredTeams(response.data);
    } catch (error) {
      console.error('Error searching teams:', error);
      // Fallback to client-side filtering
      const filtered = allTeams.filter((team) =>
        team.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  };

  const handleRouting = (teamId: string) => {
    router.push(`/team/${teamId}`);
  };

  // Filter change handler
  const handleFilterChange = (filterId: string, value: string | string[] | number) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, value } : f))
    );
  };

  // Reset handler
  const handleReset = () => {
    setSearchQuery('');
    setFilters((prev) =>
      prev.map((f) => ({ ...f, value: f.type === 'number' ? 0 : '' }))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center mt-20">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
          Teams
        </h1>

        <SearchBar
          placeholder="Search teams by name..."
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          results={filteredTeams.map((team) => ({
            id: team.id,
            name: team.name,
          }))}
          showFilters={true}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              id={team.id}
              name={team.name}
              colorPrimary={team.colorPrimary}
              colorSecondary={team.colorSecondary}
              logoUrl={team.logoUrl}
              onClick={handleRouting}
            />
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center mt-12 text-gray-500">
            No teams found
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && !searchQuery && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
