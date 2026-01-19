import './AnalyticsCard.css';

interface ChartData {
  label: string;
  value: number;
}

interface AnalyticsCardProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'stats';
}

export default function AnalyticsCard({ title, data, type = 'bar' }: AnalyticsCardProps) {
  if (type === 'stats') {
    return (
      <div className="analytics-card">
        <h3>{title}</h3>
        <div className="analytics-stat-grid">
          {data.map((item, index) => (
            <div key={index} className="analytics-stat-item">
              <div className="analytics-stat-value">{item.value}</div>
              <div className="analytics-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="analytics-card">
      <h3>{title}</h3>
      <div className="analytics-chart">
        {data.map((item, index) => (
          <div
            key={index}
            className="analytics-bar"
            style={{ height: `${(item.value / maxValue) * 100}%` }}
          >
            <div className="analytics-bar-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
