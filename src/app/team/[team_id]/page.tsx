'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TeamRedirect() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.team_id as string;

  useEffect(() => {
    // Redirect to stats page by default
    router.replace(`/team/${teamId}/stats`);
  }, [teamId, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-zinc-900 dark:text-white">Loading...</p>
    </div>
  );
}
