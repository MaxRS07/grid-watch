import PlayerHeader from '@/components/PlayerHeader';
import StatCard from '@/components/StatCard';
import MatchHistory from '@/components/MatchHistory';
import WeaponStats from '@/components/WeaponStats';
import { samplePlayer, sampleMatches, sampleWeapons } from '@/data/sampleData';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PlayerHeader player={samplePlayer} />
        
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Win Rate"
            value={`${samplePlayer.winRate}%`}
            subtext={`${samplePlayer.gamesPlayed} games played`}
          />
          <StatCard
            label="K/D/A Ratio"
            value={samplePlayer.kda.toFixed(2)}
            subtext={`${samplePlayer.kills}/${samplePlayer.deaths}/${samplePlayer.assists}`}
          />
          <StatCard
            label="Avg Damage"
            value={samplePlayer.averageDamage.toLocaleString()}
            subtext="per round"
          />
          <StatCard
            label="Headshot %"
            value={`${samplePlayer.headshotPercentage}%`}
            subtext={`${samplePlayer.accuracyPercentage}% accuracy`}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <MatchHistory matches={sampleMatches} />
          <WeaponStats weapons={sampleWeapons} />
        </div>
      </div>
    </div>
  );
}
