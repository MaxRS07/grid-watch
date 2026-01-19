import { Team } from '@/data/allData';
import './ResultCard.css';
import { title } from 'process';

interface ResultCardProps {
  id: string;
  name: string;
  title?: string;
  onClick?: (id: string) => void;
}

export default function ResultCard({ id, name, onClick }: ResultCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="result-card" onClick={() => onClick?.(id)} style={{ position: 'relative' }}>
      <div className="result-card-header">
        <div className="result-card-avatar">{initials}</div>
        <div className="result-card-info">
          <div className="result-card-name">{name}</div>
          {title && <div className="result-card-rank">{title}</div>}
        </div>
      </div>
    </div>
  );
}
