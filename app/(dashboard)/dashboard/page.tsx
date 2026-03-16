import { ArrowUpRight, TrendingUp, Clock, Target, Zap, Shield } from 'lucide-react';

export default function DashboardPage() {
  const metrics = [
    { label: 'Annonser analyserade', value: '2,412', change: '+12%', positive: true, icon: Target },
    { label: 'Genomsn. Brand Fit', value: '78.4', change: '+3.1', positive: true, icon: Zap },
    { label: 'Compliance-kvot', value: '94%', change: '+0.5%', positive: true, icon: Shield },
    { label: 'Tid sparad', value: '142h', sublabel: 'denna månad', icon: Clock },
  ];

  const recentAnalyses = [
    { name: 'Bolånekampanj Q1', channel: 'Meta', time: '2 timmar sedan', score: 85 },
    { name: 'Sparande-annons', channel: 'Instagram', time: '5 timmar sedan', score: 72 },
    { name: 'Pensionserbjudande', channel: 'Display', time: 'igår', score: 91 },
    { name: 'Företagslån', channel: 'Meta', time: 'igår', score: 68 },
    { name: 'Mobilbank-kampanj', channel: 'TikTok', time: '2 dagar sedan', score: 77 },
  ];

  const brandHealth = [
    { name: 'Visuell identitet', value: 82 },
    { name: 'Tone of Voice', value: 88 },
    { name: 'Compliance', value: 94 },
  ];

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Översikt av er kreativa prestation</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="metric-card">
              <div className="flex items-start justify-between mb-3">
                <span className="metric-label">{metric.label}</span>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-nordea-medium" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="metric-value">{metric.value}</span>
                {metric.change && (
                  <span className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                    <TrendingUp className="w-3 h-3 mr-1 inline" />
                    {metric.change}
                  </span>
                )}
                {metric.sublabel && (
                  <span className="text-sm text-white/40 ml-2">{metric.sublabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 glass-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white">Senaste analyser</h3>
          </div>
          <div className="divide-y divide-white/5">
            {recentAnalyses.map((analysis, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nordea-blue/20 to-nordea-vivid/20 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-nordea-medium" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{analysis.name}</p>
                    <p className="text-sm text-white/50">{analysis.channel} · {analysis.time}</p>
                  </div>
                </div>
                <div className={`score-badge ${getScoreClass(analysis.score)}`}>
                  {analysis.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Health */}
        <div className="glass-card">
          <h3 className="font-semibold text-white mb-6">Varumärkeshälsa</h3>
          <div className="space-y-5">
            {brandHealth.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">{item.name}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-white/50">
              Tone of Voice har förbättrats med 3.1 poäng senaste månaden. Fortsätt använda enkla, tydliga formuleringar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
