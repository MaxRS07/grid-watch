'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import TournamentCard from '@/components/TournamentCard';
import { Tournament } from '@/data/allData';
import { fetchTournaments } from '@/lib/grid/tournaments';

export default function TournamentsPage() {
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch tournaments from API
  useEffect(() => {
    fetchTournaments()
      .then((tournaments) => {
        setAllTournaments(tournaments);
        setFilteredTournaments(tournaments);
      })
      .catch((err) => {
        console.error('Error fetching tournaments:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRouting = (tournamentId: string) => {
    router.push(`/tournament/${tournamentId}`);
  };

  // Search handler
  const handleSearch = (query: string, filter: string) => {
    const lowerQuery = query.toLowerCase();

    const filtered = allTournaments.filter((tournament) => {
      const matchesQuery = 
        tournament.name.toLowerCase().includes(lowerQuery) ||
        tournament.nameShortened.toLowerCase().includes(lowerQuery);
      
      return matchesQuery;
    });

    setFilteredTournaments(filtered);
  };

  if (loading) {
    return <p className="text-center mt-20">Loading tournaments...</p>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
          Tournaments
        </h1>

        <SearchBar
          placeholder="Search tournaments..."
          filters={['all', 'active', 'upcoming', 'past']}
          onSearch={handleSearch}
          results={filteredTournaments}
        />

        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              id={tournament.id}
              name={tournament.name}
              nameShortened={tournament.nameShortened}
              onClick={handleRouting}
            />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center mt-12 text-gray-500">
            No tournaments found
          </div>
        )}
      </div>
    </div>
  );
}
