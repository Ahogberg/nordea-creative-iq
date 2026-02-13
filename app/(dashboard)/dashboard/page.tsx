import { MetricCard, SectionHeader } from '@/components/ui/nordea';
import { ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const metrics = [
    { label: 'Annonser analyserade', value: '2,412', change: { value: '+12%', positive: true } },
    { label: 'Genomsn. Brand Fit', value: '78.4', change: { value: '+3.1', positive: true } },
    { label: 'Compliance-kvot', value: '94%', change: { value: '+0.5%', positive: true } },
    { label: 'Tid sparad', value: '142h', sublabel: 'denna månad' },
  ];

  const recentAnalyses = [
    { name: 'Bolånekampanj Q1', channel: 'Meta', time: '2 timmar sedan', score: 85 },
    { name: 'Sparande-annons', channel: 'Instagram', time: '5 timmar sedan', score: 72 },
    { name: 'Pensionserbjudande', channel: 'Display', time: 'igår', score: 91 },
    { name: 'Företagslån', channel: 'Meta', time: 'igår', score: 68 },
    { name: 'Mobilbank-kampanj', channel: 'TikTok', time: '2 dagar sedan', score: 77 },
  ];

  const brandHealth = { visual: 82, toneOfVoice: 88, compliance: 94 };

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader title="Dashboard" description="Översikt av er kreativa prestation" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Senaste analyser</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAnalyses.map((a, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-sm text-gray-500">{a.channel} &middot; {a.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{a.score}</span>
                  <span className="text-sm text-gray-400">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Varumärkeshälsa</h3>
          </div>
          <div className="p-5 space-y-5">
            {Object.entries(brandHealth).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {key === 'visual' ? 'Visuell identitet' : key === 'toneOfVoice' ? 'Tone of Voice' : 'Compliance'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0000A0] rounded-full" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Tone of Voice har förbättrats med 3.1 poäng senaste månaden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
