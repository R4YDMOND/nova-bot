'use client';

type TimelinePoint = {
  date: string;
  count: number;
};

interface ActivityChartProps {
  points: TimelinePoint[];
  period: '24h' | '7d' | '30d';
}

function formatLabel(date: string, period: ActivityChartProps['period']) {
  const d = new Date(date);
  return period === '24h'
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export function ActivityChart({ points, period }: ActivityChartProps) {
  if (points.length === 0) return null;
  const width = 280;
  const height = 80;
  const max = Math.max(1, ...points.map((p) => p.count));
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points
    .map((p, i) => `${(i * stepX).toFixed(1)},${(height - (p.count / max) * height).toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 text-indigo-500" preserveAspectRatio="none">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={coords} />
      </svg>
      <div className="flex justify-between mt-1 text-[9px] font-semibold text-[rgb(var(--text-secondary))]">
        <span>{formatLabel(points[0].date, period)}</span>
        <span>{formatLabel(points[points.length - 1].date, period)}</span>
      </div>
    </div>
  );
}