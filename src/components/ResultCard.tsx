import { Player, Team } from '@/data/allData';
import './ResultCard.css';

interface ResultCardProps {
  id: string;
  name: string;
  title?: string;
  team?: Team;
  onClick?: (id: string) => void;
}

export default function ResultCard({ id, name, title, team, onClick }: ResultCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join()
    .toUpperCase()
    .slice(0, 2);

  const avatarStyle = team?.colorPrimary
    ? {
      background: `linear-gradient(135deg, ${team.colorPrimary} 0%, ${team.colorSecondary || team.colorPrimary} 100%)`
    }
    : {};

  return (
    <div className="result-card" onClick={() => onClick?.(id)} style={{ position: 'relative' }}>
      <div className="result-card-header">
        <div className="result-card-avatar" style={avatarStyle}>
          {team?.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '50%',
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="result-card-info">
          <div className="result-card-name">{name}</div>
          <div className="result-card-details">
            {title && <span className="result-card-title">{title}</span>}
            {team && <span className="result-card-team">{team.name}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
