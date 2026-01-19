'use client';

interface SeriesCardProps {
  id: string;
  title: string;
  tournament: string;
  startTime: string;
  format: string;
  teams: {
    id: string;
    name: string;
    scoreAdvantage: number;
    colorPrimary?: string;
    colorSecondary?: string;
    logoUrl?: string;
  }[];
  onClick?: (id: string) => void;
}

export default function SeriesCard({
  id,
  title,
  tournament,
  startTime,
  format,
  teams,
  onClick
}: SeriesCardProps) {
  // Format the date/time
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format time
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format date
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Relative time
    let relativeTime = '';
    if (diffMs < 0) {
      relativeTime = 'Live/Past';
    } else if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      relativeTime = `In ${diffMins}m`;
    } else if (diffHours < 24) {
      relativeTime = `In ${diffHours}h`;
    } else if (diffDays < 7) {
      relativeTime = `In ${diffDays}d`;
    }

    return { timeStr, dateStr, relativeTime };
  };

  const { timeStr, dateStr, relativeTime } = formatDateTime(startTime);
  const team1 = teams[0];
  const team2 = teams[1];

  return (
    <div
      className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all duration-200 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg"
      onClick={() => onClick?.(id)}
    >
      {/* Tournament Badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
            {tournament}
          </div>
          {format && (
            <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs">
              {format}
            </div>
          )}
        </div>
        {relativeTime && (
          <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
            {relativeTime}
          </div>
        )}
      </div>

      {/* Match Title */}
      {title && (
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {title.toUpperCase()} {tournament}
        </div>
      )}

      {/* Teams */}
      <div className="mb-4">
        {team1 && team2 ? (
          <div className="flex items-center justify-between gap-4">
            {/* Team 1 */}
            <div className="flex-1 flex items-center gap-3">
              {team1.logoUrl ? (
                <img
                  src={team1.logoUrl}
                  alt={team1.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{
                    background: team1.colorPrimary
                      ? `linear-gradient(135deg, ${team1.colorPrimary} 0%, ${team1.colorSecondary || team1.colorPrimary} 100%)`
                      : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                  }}
                >
                  {team1.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-900 dark:text-white truncate">
                  {team1.name}
                </div>
                {team1.scoreAdvantage > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    +{team1.scoreAdvantage} advantage
                  </div>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="flex-shrink-0 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">VS</span>
            </div>

            {/* Team 2 */}
            <div className="flex-1 flex items-center gap-3 flex-row-reverse">
              {team2.logoUrl ? (
                <img
                  src={team2.logoUrl}
                  alt={team2.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{
                    background: team2.colorPrimary
                      ? `linear-gradient(135deg, ${team2.colorPrimary} 0%, ${team2.colorSecondary || team2.colorPrimary} 100%)`
                      : 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)'
                  }}
                >
                  {team2.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 text-right">
                <div className="font-semibold text-zinc-900 dark:text-white truncate">
                  {team2.name}
                </div>
                {team2.scoreAdvantage > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    +{team2.scoreAdvantage} advantage
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 dark:text-zinc-500 text-sm">
            Teams TBD
          </div>
        )}
      </div>

      {/* Date/Time */}
      <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
