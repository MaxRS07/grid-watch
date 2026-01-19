'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PlayerRedirect() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.player_id as string;

  useEffect(() => {
    // Redirect to stats page by default
    router.replace(`/player/${playerId}/stats`);
  }, [playerId, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-zinc-900 dark:text-white">Loading...</p>
    </div>
  );
}
