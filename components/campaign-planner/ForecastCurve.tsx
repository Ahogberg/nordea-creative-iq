'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Kumulativ räckvidd över kampanjperioden med avtagande marginalnytta:
// reach(t) = totalReach * (1 - e^(-k·t/duration)), k=3 ger ~95 % vid periodens slut.
export function buildReachSeries(uniqueReach: number, durationDays: number) {
  const k = 3;
  const points: Array<{ day: number; reach: number }> = [];
  const step = Math.max(1, Math.round(durationDays / 30));
  for (let day = 0; day <= durationDays; day += step) {
    points.push({
      day,
      reach: Math.round(uniqueReach * (1 - Math.exp((-k * day) / durationDays))),
    });
  }
  if (points[points.length - 1].day !== durationDays) {
    points.push({ day: durationDays, reach: Math.round(uniqueReach * (1 - Math.exp(-k))) });
  }
  return points;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function ForecastCurve({ uniqueReach, durationDays }: { uniqueReach: number; durationDays: number }) {
  const data = buildReachSeries(uniqueReach, durationDays);
  if (uniqueReach <= 0) return null;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0000A0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0000A0" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => `Dag ${d}`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
            width={44}
          />
          <Tooltip
            formatter={(value) => [`${Math.round(Number(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} personer`, 'Unik räckvidd']}
            labelFormatter={(d) => `Dag ${d}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Area
            type="monotone"
            dataKey="reach"
            stroke="#0000A0"
            strokeWidth={2}
            fill="url(#reachFill)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
