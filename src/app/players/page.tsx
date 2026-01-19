'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import { Player } from '@/data/allData';
import { fetchPlayers, searchPlayersByNickname } from '@/lib/grid/players';
import { useRouter } from 'next/navigation';

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const router = useRouter();

  // Fetch players from API
  useEffect(() => {
    fetchPlayers(48)
      .then((response) => {
        setAllPlayers(response.data);
        setFilteredPlayers(response.data); // initially show all players
        setHasNextPage(response.pageInfo.hasNextPage);
        setNextCursor(response.pageInfo.endCursor);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRouting = (playerId: string) => {
    router.push(`/player/${playerId}/stats`);
  }

  const handleLoadMore = async () => {
    if (!nextCursor) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchPlayers(48, nextCursor);
      setAllPlayers((prev) => [...prev, ...response.data]);
      setFilteredPlayers((prev) => [...prev, ...response.data]);
      setHasNextPage(response.pageInfo.hasNextPage);
      setNextCursor(response.pageInfo.endCursor);
    } catch (error) {
      console.error('Error loading more players:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Search handler
  const handleSearch = async (query: string, filter: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();

    if (!query.trim()) {
      // If search is empty, show all players
      const filtered = allPlayers.filter((player) => {
        const matchesFilter =
          filter === 'all' || player.title.toLowerCase() === filter.toLowerCase();
        return matchesFilter;
      });
      setFilteredPlayers(filtered);
      return;
    }

    try {
      // Search via API
      const response = await searchPlayersByNickname(query, 48);
      const searchedPlayers = response.data;

      // Apply title filter if needed
      const filtered = searchedPlayers.filter((player) => {
        const matchesFilter =
          filter === 'all' || player.title.toLowerCase() === filter.toLowerCase();
        return matchesFilter;
      });

      setFilteredPlayers(filtered);
    } catch (error) {
      console.error('Error searching players:', error);
      // Fallback to client-side filtering
      const filtered = allPlayers.filter((player) => {
        const matchesQuery = player.name.toLowerCase().includes(lowerQuery);
        const matchesFilter =
          filter === 'all' || player.title.toLowerCase() === filter.toLowerCase();
        return matchesQuery && matchesFilter;
      });
      setFilteredPlayers(filtered);
    }
  };

  if (loading)
    return <p className="text-center mt-20">Loading players...</p>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
          Top Players
        </h1>

        <SearchBar
          placeholder="Search players..."
          onSearch={(query) => handleSearch(query, 'all')}
          results={filteredPlayers}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {filteredPlayers.map((player) => (
            <ResultCard
              key={player.id}
              id={player.id}
              name={player.name}
              title={player.title}
              onClick={handleRouting}
            />
          ))}
        </div>

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
