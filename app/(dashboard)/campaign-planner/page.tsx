'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  Download,
  Save,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface Channel {
  id: string;
  label: string;
  emoji: string;
  cpm: number;
  ctr: number; // percentage, e.g. 0.8 means 0.8%
  reachRate: number;
}

const CHANNELS: Channel[] = [
  { id: 'linkedin', label: 'LinkedIn', emoji: '\uD83D\uDCBC', cpm: 180, ctr: 0.8, reachRate: 0.65 },
  { id: 'meta', label: 'Meta/Instagram', emoji: '\uD83D\uDCF1', cpm: 95, ctr: 1.2, reachRate: 0.72 },
  { id: 'display', label: 'Display/Programmatic', emoji: '\uD83D\uDDA5\uFE0F', cpm: 45, ctr: 0.15, reachRate: 0.85 },
  { id: 'youtube', label: 'YouTube', emoji: '\u25B6\uFE0F', cpm: 120, ctr: 0.5, reachRate: 0.58 },
  { id: 'tiktok', label: 'TikTok', emoji: '\uD83C\uDFB5', cpm: 85, ctr: 1.5, reachRate: 0.68 },
];

const GEOGRAPHIES = [
  { code: 'SE', label: 'Sverige' },
  { code: 'DK', label: 'Danmark' },
  { code: 'NO', label: 'Norge' },
  { code: 'FI', label: 'Finland' },
  { code: 'EE', label: 'Estland' },
  { code: 'LT', label: 'Litauen' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

function formatCurrency(n: number): string {
  return `${formatNumber(n)} SEK`;
}

function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}\u00A0%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChannelState {
  enabled: boolean;
  allocation: number; // 0-100
}

interface ChannelResult {
  channelId: string;
  budget: number;
  impressions: number;
  reach: number;
  clicks: number;
  frequency: number;
}

export default function CampaignPlannerPage() {
  // Budget & Duration
  const [budget, setBudget] = useState<number>(500000);
  const [budgetInput, setBudgetInput] = useState<string>('500 000');
  const [duration, setDuration] = useState<number>(30);

  // Channel states
  const [channelStates, setChannelStates] = useState<Record<string, ChannelState>>(() => {
    const initial: Record<string, ChannelState> = {};
    CHANNELS.forEach((ch) => {
      initial[ch.id] = { enabled: true, allocation: 20 };
    });
    return initial;
  });

  // Audience config
  const [audienceSize, setAudienceSize] = useState<number>(500000);
  const [audienceInput, setAudienceInput] = useState<string>('500 000');
  const [selectedGeos, setSelectedGeos] = useState<string[]>(['SE']);
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(65);

  // ---- Budget input handler ----
  const handleBudgetChange = useCallback((raw: string) => {
    const cleaned = raw.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10) || 0;
    setBudget(num);
    setBudgetInput(num > 0 ? formatNumber(num) : '');
  }, []);

  // ---- Audience input handler ----
  const handleAudienceChange = useCallback((raw: string) => {
    const cleaned = raw.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10) || 0;
    setAudienceSize(num);
    setAudienceInput(num > 0 ? formatNumber(num) : '');
  }, []);

  // ---- Channel toggle / allocation ----
  const toggleChannel = useCallback((id: string) => {
    setChannelStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }, []);

  const setAllocation = useCallback((id: string, value: number) => {
    setChannelStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], allocation: value },
    }));
  }, []);

  // ---- Geo toggle ----
  const toggleGeo = useCallback((code: string) => {
    setSelectedGeos((prev) =>
      prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code]
    );
  }, []);

  // ---- Total allocation ----
  const totalAllocation = useMemo(() => {
    return CHANNELS.reduce((sum, ch) => {
      const state = channelStates[ch.id];
      return sum + (state.enabled ? state.allocation : 0);
    }, 0);
  }, [channelStates]);

  // ---- Forecast calculations ----
  const { channelResults, uniqueReach, totalImpressions, totalClicks, avgFrequency, avgCPM, avgCPC, reachPercentage } =
    useMemo(() => {
      const results: ChannelResult[] = [];

      CHANNELS.forEach((ch) => {
        const state = channelStates[ch.id];
        if (!state.enabled || state.allocation <= 0) return;

        const channelBudget = budget * (state.allocation / 100);
        const impressions = (channelBudget / ch.cpm) * 1000;
        const maxReach = audienceSize * ch.reachRate;
        const reach = Math.min(maxReach, impressions * 0.6);
        const clicks = impressions * (ch.ctr / 100);
        const frequency = reach > 0 ? impressions / reach : 0;

        results.push({
          channelId: ch.id,
          budget: channelBudget,
          impressions,
          reach,
          clicks,
          frequency,
        });
      });

      const sumImpressions = results.reduce((s, r) => s + r.impressions, 0);
      const sumReach = results.reduce((s, r) => s + r.reach, 0);
      const sumClicks = results.reduce((s, r) => s + r.clicks, 0);
      const uReach = sumReach * 0.75;
      const aFreq = uReach > 0 ? sumImpressions / uReach : 0;
      const cpm = sumImpressions > 0 ? (budget / sumImpressions) * 1000 : 0;
      const cpc = sumClicks > 0 ? budget / sumClicks : 0;
      const rPct = audienceSize > 0 ? (uReach / audienceSize) * 100 : 0;

      return {
        channelResults: results,
        uniqueReach: uReach,
        totalImpressions: sumImpressions,
        totalClicks: sumClicks,
        avgFrequency: aFreq,
        avgCPM: cpm,
        avgCPC: cpc,
        reachPercentage: rPct,
      };
    }, [budget, channelStates, audienceSize]);

  // ---- Warnings ----
  const warnings: string[] = [];
  if (avgFrequency > 8) {
    warnings.push(
      `Hog frekvens (${avgFrequency.toFixed(1)}). Risk for annonstrotthet - overväg att bredda målgruppen eller minska budgeten.`
    );
  }
  if (reachPercentage > 0 && reachPercentage < 10) {
    warnings.push(
      `Låg räckvidd (${formatPercent(reachPercentage)}). Overväg att oka budgeten eller justera kanalfordelningen.`
    );
  }
  if (totalAllocation > 100) {
    warnings.push(
      `Total kanalfordelning overstiger 100% (${totalAllocation}%). Justera fordelningen.`
    );
  }

  // ---- Metric card helper ----
  const MetricCard = ({
    label,
    value,
    sub,
  }: {
    label: string;
    value: string;
    sub?: string;
  }) => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampanjplanerare</h1>
          <p className="text-gray-500 mt-1">
            Planera budget, kanalfordelning och prognostisera kampanjresultat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportera PDF
          </Button>
          <Button className="gap-2 bg-[#0000A0] hover:bg-[#000080] text-white">
            <Save className="w-4 h-4" />
            Spara kampanj
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4"
            >
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800">{w}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Inputs */}
        <div className="xl:col-span-1 space-y-6">
          {/* Budget & Duration */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0000A0]" />
                Budget & varaktighet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="budget">Total budget (SEK)</Label>
                <Input
                  id="budget"
                  value={budgetInput}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  placeholder="500 000"
                  className="text-right font-mono"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Kampanjlangd</Label>
                  <span className="text-sm font-medium text-[#0000A0]">{duration} dagar</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={(v) => setDuration(v[0])}
                  min={7}
                  max={90}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>7 dagar</span>
                  <span>90 dagar</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channel Mixer */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-base">Kanalfordelning</CardTitle>
                <Badge
                  variant={totalAllocation > 100 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {totalAllocation}% fordelat
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {CHANNELS.map((ch) => {
                const state = channelStates[ch.id];
                return (
                  <div key={ch.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={state.enabled}
                          onCheckedChange={() => toggleChannel(ch.id)}
                        />
                        <span className="text-sm font-medium">
                          {ch.emoji} {ch.label}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-mono ${
                          state.enabled ? 'text-[#0000A0] font-medium' : 'text-gray-300'
                        }`}
                      >
                        {state.enabled ? `${state.allocation}%` : 'Av'}
                      </span>
                    </div>
                    {state.enabled && (
                      <Slider
                        value={[state.allocation]}
                        onValueChange={(v) => setAllocation(ch.id, v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    )}
                    {state.enabled && (
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>CPM: {ch.cpm} SEK</span>
                        <span>CTR: {ch.ctr}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Audience Config */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0000A0]" />
                Målgrupp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="audience">Målgruppsstorlek</Label>
                <Input
                  id="audience"
                  value={audienceInput}
                  onChange={(e) => handleAudienceChange(e.target.value)}
                  placeholder="500 000"
                  className="text-right font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Geografi</Label>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIES.map((geo) => {
                    const isSelected = selectedGeos.includes(geo.code);
                    return (
                      <button
                        key={geo.code}
                        type="button"
                        onClick={() => toggleGeo(geo.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#0000A0] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {geo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Åldersintervall</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={ageMin}
                    onChange={(e) => setAgeMin(Math.max(13, Math.min(Number(e.target.value), ageMax - 1)))}
                    className="w-20 text-center font-mono"
                    min={13}
                    max={99}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    value={ageMax}
                    onChange={(e) => setAgeMax(Math.max(ageMin + 1, Math.min(Number(e.target.value), 99)))}
                    className="w-20 text-center font-mono"
                    min={13}
                    max={99}
                  />
                  <span className="text-xs text-gray-400">ar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Forecast & Breakdown */}
        <div className="xl:col-span-2 space-y-6">
          {/* Forecast Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0000A0]" />
                Prognos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Unik rackvidd"
                  value={formatNumber(uniqueReach)}
                  sub="Estimerade unika personer"
                />
                <MetricCard
                  label="Totala visningar"
                  value={formatNumber(totalImpressions)}
                  sub="Impressions totalt"
                />
                <MetricCard
                  label="Klick"
                  value={formatNumber(totalClicks)}
                  sub="Estimerade klick"
                />
                <MetricCard
                  label="Frekvens"
                  value={avgFrequency.toFixed(1)}
                  sub="Snittvisningar per person"
                />
                <MetricCard
                  label="CPM"
                  value={formatCurrency(avgCPM)}
                  sub="Kostnad per 1 000 visningar"
                />
                <MetricCard
                  label="CPC"
                  value={formatCurrency(avgCPC)}
                  sub="Kostnad per klick"
                />
                <MetricCard
                  label="Rackvidd %"
                  value={formatPercent(reachPercentage)}
                  sub="Av total målgrupp"
                />
                <MetricCard
                  label="Daglig budget"
                  value={formatCurrency(duration > 0 ? budget / duration : 0)}
                  sub={`Over ${duration} dagar`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Channel Breakdown Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Kanalfordelning - detaljer</CardTitle>
            </CardHeader>
            <CardContent>
              {channelResults.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aktivera minst en kanal for att se prognos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 font-medium text-gray-500">Kanal</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Budget</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Visningar</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Rackvidd</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Klick</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Frekvens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelResults.map((result) => {
                        const ch = CHANNELS.find((c) => c.id === result.channelId)!;
                        const freqWarning = result.frequency > 8;
                        return (
                          <tr
                            key={result.channelId}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium">
                              {ch.emoji} {ch.label}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-gray-700">
                              {formatCurrency(result.budget)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-gray-700">
                              {formatNumber(result.impressions)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-gray-700">
                              {formatNumber(result.reach)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-gray-700">
                              {formatNumber(result.clicks)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono">
                              <span
                                className={
                                  freqWarning
                                    ? 'text-yellow-600 font-semibold'
                                    : 'text-gray-700'
                                }
                              >
                                {result.frequency.toFixed(1)}
                                {freqWarning && (
                                  <AlertTriangle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-semibold">
                        <td className="py-3 px-2">Totalt</td>
                        <td className="py-3 px-2 text-right font-mono">
                          {formatCurrency(
                            channelResults.reduce((s, r) => s + r.budget, 0)
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {formatNumber(totalImpressions)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {formatNumber(uniqueReach)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {formatNumber(totalClicks)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {avgFrequency.toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget allocation visual bar */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Budgetfordelning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channelResults.map((result) => {
                  const ch = CHANNELS.find((c) => c.id === result.channelId)!;
                  const pct = budget > 0 ? (result.budget / budget) * 100 : 0;
                  return (
                    <div key={result.channelId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {ch.emoji} {ch.label}
                        </span>
                        <span className="text-gray-500">{formatCurrency(result.budget)}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0000A0] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
