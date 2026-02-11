'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Palette,
  PenTool,
  BarChart3,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  Target,
} from 'lucide-react';

const stats = [
  {
    label: 'Annonser analyserade',
    value: '2,412',
    change: '+12%',
    trend: 'up' as const,
    icon: Target,
  },
  {
    label: 'Genomsn. Brand Fit',
    value: '78.4',
    change: '+3.1',
    trend: 'up' as const,
    icon: CheckCircle2,
  },
  {
    label: 'Compliance-kvot',
    value: '94%',
    change: '+0.5%',
    trend: 'up' as const,
    icon: CheckCircle2,
  },
  {
    label: 'Tid sparad',
    value: '142h',
    change: 'denna månad',
    trend: 'neutral' as const,
    icon: Clock,
  },
] as const;

const quickActions = [
  {
    id: 'ad-studio',
    title: 'Analysera annons',
    description: 'Ladda upp och utvärdera annonsprestation',
    icon: Palette,
    color: 'bg-blue-50 text-[#0000A0]',
    href: '/ad-studio',
  },
  {
    id: 'copy-studio',
    title: 'Generera copy',
    description: 'Skapa kanaloptimerad text med AI',
    icon: PenTool,
    color: 'bg-purple-50 text-purple-600',
    href: '/copy-studio',
  },
  {
    id: 'campaign-planner',
    title: 'Planera kampanj',
    description: 'Budgetera och prognostisera resultat',
    icon: BarChart3,
    color: 'bg-green-50 text-green-600',
    href: '/campaign-planner',
  },
  {
    id: 'localization',
    title: 'Lokalisera',
    description: 'Anpassa för nordiska marknader',
    icon: Globe,
    color: 'bg-orange-50 text-orange-600',
    href: '/localization',
  },
];

const recentAnalyses = [
  { id: '1', title: 'Bolånekampanj Q1 - LinkedIn', score: 85, time: '2 timmar sedan' },
  { id: '2', title: 'Sparande-annons Instagram', score: 72, time: '5 timmar sedan' },
  { id: '3', title: 'Pensionserbjudande Display', score: 91, time: 'igår' },
  { id: '4', title: 'Företagslån Facebook', score: 68, time: 'igår' },
  { id: '5', title: 'Mobilbank-kampanj TikTok', score: 77, time: '2 dagar sedan' },
];

function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#00A76F' : score >= 60 ? '#F59E0B' : '#DC3545';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold">{score}</span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Översikt av er kreativa prestation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-gray-400" />
                {stat.trend === 'up' && (
                  <span className="flex items-center text-xs text-green-600 font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </span>
                )}
                {(stat.trend as string) === 'down' && (
                  <span className="flex items-center text-xs text-red-600 font-medium">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {stat.change}
                  </span>
                )}
                {stat.trend === 'neutral' && (
                  <span className="text-xs text-gray-500">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Snabbåtgärder</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  <div className="flex items-center gap-1 text-[#0000A0] text-sm font-medium mt-3">
                    Öppna <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Senaste analyser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => {
                const scoreColor =
                  analysis.score >= 80
                    ? 'bg-green-100 text-green-700'
                    : analysis.score >= 60
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700';
                return (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{analysis.title}</p>
                        <p className="text-xs text-gray-500">{analysis.time}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${scoreColor}`}>
                      {analysis.score}/100
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Brand DNA Health */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Brand DNA Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-around">
                {[
                  { score: 82, label: 'Visual Identity' },
                  { score: 88, label: 'Tone of Voice' },
                  { score: 94, label: 'Compliance' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 relative">
                    <ScoreRing score={item.score} size={72} label={item.label} />
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-medium text-[#0000A0] mb-1">AI-insikt</p>
                <p className="text-xs text-gray-600">
                  Tone of Voice har förbättrats med 3.1 poäng senaste månaden. Fortsätt använda
                  enkla, tydliga formuleringar i bolånekampanjer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
