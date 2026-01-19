import { MatchHistory as MatchHistoryType } from '@/types/player';
import './MatchHistory.css';

interface MatchHistoryProps {
  matches: MatchHistoryType[];
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  return (
    <div className="match-history">
      <h2>Recent Matches</h2>
      {matches.map((match) => (
        <div key={match.id} className="match-item">
          <div className={`match-result ${match.result}`}>
            {match.result.toUpperCase()}
          </div>
          <div className="match-details">
            <div className="match-map">{match.mapName}</div>
            <div className="match-score">{match.score}</div>
          </div>
          <div className="match-stats">
            <span className="match-kda">
              {match.kills}/{match.deaths}/{match.assists}
            </span>
            <span className="match-date">{match.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
