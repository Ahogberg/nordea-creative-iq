'use client';

import { cn } from '@/lib/utils';

const stats = [
  { label: 'Analyser', value: '2,412' },
  { label: 'Brand Fit', value: '78.4' },
  { label: 'Compliance', value: '94%' },
  { label: 'Sparad tid', value: '142h' },
];

const recentAnalyses = [
  { id: '1', title: 'Bolånekampanj Q1 - LinkedIn', score: 85, time: '2 tim sedan' },
  { id: '2', title: 'Sparande-annons Instagram', score: 72, time: '5 tim sedan' },
  { id: '3', title: 'Pensionserbjudande Display', score: 91, time: 'igår' },
  { id: '4', title: 'Företagslån Facebook', score: 68, time: 'igår' },
  { id: '5', title: 'Mobilbank-kampanj TikTok', score: 77, time: '2 dagar sedan' },
];

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-lg font-medium text-gray-900">Översikt</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-medium text-gray-900 tabular-nums">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100" />

      {/* Recent */}
      <div>
        <h2 className="text-sm font-medium text-gray-900 mb-4">Senaste</h2>
        <div className="space-y-0">
          {recentAnalyses.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-700">{a.title}</span>
              <div className="flex items-center gap-6">
                <span className={cn('text-sm tabular-nums font-medium', scoreColor(a.score))}>
                  {a.score}
                </span>
                <span className="text-xs text-gray-400 w-24 text-right">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
