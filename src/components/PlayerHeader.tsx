import { PlayerStats } from '@/types/player';
import './PlayerHeader.css';

interface PlayerHeaderProps {
  player: PlayerStats;
}

export default function PlayerHeader({ player }: PlayerHeaderProps) {
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="player-header flex items-center">
      <div className="player-avatar">{initials}</div>
      <div className="player-info">
        <h1 className="player-name">{player.name}</h1>
        <span className="player-rank">{player.rank}</span>
      </div>
    </div>
  );
}
