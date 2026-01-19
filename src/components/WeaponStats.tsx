import { WeaponStats as WeaponStatsType } from '@/types/player';
import './WeaponStats.css';

interface WeaponStatsProps {
  weapons: WeaponStatsType[];
}

export default function WeaponStats({ weapons }: WeaponStatsProps) {
  return (
    <div className="weapon-stats">
      <h2>Top Weapons</h2>
      {weapons.map((weapon, index) => (
        <div key={index} className="weapon-item">
          <div>
            <div className="weapon-name">{weapon.name}</div>
            <div className="weapon-kills">{weapon.kills} kills</div>
          </div>
          <div className="weapon-metrics">
            <div className="weapon-metric">
              <div className="weapon-metric-label">Accuracy</div>
              <div className="weapon-metric-value">{weapon.accuracy}%</div>
            </div>
            <div className="weapon-metric">
              <div className="weapon-metric-label">Headshot</div>
              <div className="weapon-metric-value">{weapon.headshotRate}%</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
