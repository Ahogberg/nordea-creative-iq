'use client';

import { useState, useMemo, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  Calculator,
  Download,
  Save,
  AlertTriangle,
  Users,
  Briefcase,
  Smartphone,
  Monitor,
  MonitorPlay,
  Music2,
  Eye,
  MousePointerClick,
  Repeat,
  type LucideIcon,
} from 'lucide-react';
import { MediaCalculator } from '@/components/campaign-planner/MediaCalculator';
import { Topbar } from '@/components/layout/topbar';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionTitle } from '@/components/layout/section-title';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { StatCard } from '@/components/ui/stat-card';
import { NordeaBadge } from '@/components/ui/nordea-badge';
import { combineReach } from '@/lib/utils/calculations';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface Channel {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  cpm: number;
  ctr: number; // percentage, e.g. 0.8 means 0.8%
  reachRate: number;
}

const CHANNELS: Channel[] = [
  { id: 'meta', label: 'Meta/Instagram', icon: Smartphone, color: 'var(--nordea-blue)', cpm: 95, ctr: 1.2, reachRate: 0.72 },
  { id: 'youtube', label: 'YouTube', icon: MonitorPlay, color: 'var(--nordea-teal)', cpm: 120, ctr: 0.5, reachRate: 0.58 },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'var(--nordea-deep)', cpm: 85, ctr: 1.5, reachRate: 0.68 },
  { id: 'display', label: 'Display/Programmatic', icon: Monitor, color: 'var(--nordea-amber)', cpm: 45, ctr: 0.15, reachRate: 0.85 },
  { id: 'linkedin', label: 'LinkedIn', icon: Briefcase, color: 'var(--nordea-rose)', cpm: 180, ctr: 0.8, reachRate: 0.65 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatCurrency(n: number): string {
  return `${formatNumber(n)} kr`;
}

function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace('.', ',')} %`;
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

type Tab = 'planner' | 'calculator';

export default function CampaignPlannerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');

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
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(65);

  const parseAmount = (raw: string) => parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;

  const handleBudgetChange = useCallback((raw: string) => {
    const num = parseAmount(raw);
    setBudget(num);
    setBudgetInput(num > 0 ? formatNumber(num) : '');
  }, []);

  const handleAudienceChange = useCallback((raw: string) => {
    const num = parseAmount(raw);
    setAudienceSize(num);
    setAudienceInput(num > 0 ? formatNumber(num) : '');
  }, []);

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

  const totalAllocation = useMemo(
    () =>
      CHANNELS.reduce((sum, ch) => {
        const state = channelStates[ch.id];
        return sum + (state.enabled ? state.allocation : 0);
      }, 0),
    [channelStates]
  );

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

        results.push({ channelId: ch.id, budget: channelBudget, impressions, reach, clicks, frequency });
      });

      const sumImpressions = results.reduce((s, r) => s + r.impressions, 0);
      const sumClicks = results.reduce((s, r) => s + r.clicks, 0);
      // Överlapp mellan kanaler — kan aldrig överstiga målgruppen.
      const uReach = combineReach(results.map((r) => r.reach), audienceSize);
      const spent = results.reduce((s, r) => s + r.budget, 0);

      return {
        channelResults: results,
        uniqueReach: uReach,
        totalImpressions: sumImpressions,
        totalClicks: sumClicks,
        avgFrequency: uReach > 0 ? sumImpressions / uReach : 0,
        avgCPM: sumImpressions > 0 ? (spent / sumImpressions) * 1000 : 0,
        avgCPC: sumClicks > 0 ? spent / sumClicks : 0,
        reachPercentage: audienceSize > 0 ? (uReach / audienceSize) * 100 : 0,
      };
    }, [budget, channelStates, audienceSize]);

  // ---- Warnings ----
  const warnings: string[] = [];
  if (avgFrequency > 8) {
    warnings.push(
      `Hög frekvens (${avgFrequency.toFixed(1).replace('.', ',')}). Risk för annonströtthet — överväg att bredda målgruppen eller minska budgeten.`
    );
  }
  if (reachPercentage > 0 && reachPercentage < 10) {
    warnings.push(
      `Låg räckvidd (${formatPercent(reachPercentage)}). Överväg att öka budgeten eller justera kanalfördelningen.`
    );
  }
  if (totalAllocation > 100) {
    warnings.push(`Kanalfördelningen överstiger 100 % (${totalAllocation} %). Justera fördelningen.`);
  }

  const allocatedBudget = channelResults.reduce((s, r) => s + r.budget, 0);

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Verktyg', 'Mediaplanering']}
        right={
          activeTab === 'planner' ? (
            <>
              <button type="button" className="nordea-btn nordea-btn-secondary">
                <Download className="w-4 h-4" />
                Exportera PDF
              </button>
              <button type="button" className="nordea-btn nordea-btn-cobalt">
                <Save className="w-4 h-4" />
                Spara kampanj
              </button>
            </>
          ) : undefined
        }
      />

      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Mediaplanering · Sverige"
          title="Kampanjplanerare"
          description="Fördela budgeten över kanaler och se prognosen för räckvidd, frekvens och klick direkt."
          right={
            <SegmentedTabs<Tab>
              value={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'planner', label: 'Kampanjplanerare', icon: BarChart3 },
                { id: 'calculator', label: 'Mediakalkylator', icon: Calculator },
              ]}
            />
          }
        />

        {activeTab === 'calculator' && <MediaCalculator />}

        {activeTab === 'planner' && (
          <>
            {warnings.length > 0 && (
              <div className="space-y-2 mb-6">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-nordea-amber/30 bg-nordea-amber-soft px-4 py-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-nordea-amber mt-0.5 shrink-0" />
                    <p className="text-sm text-nordea-text">{w}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
              {/* ── Vänster: indata ── */}
              <div className="space-y-5">
                <div className="nordea-card p-5">
                  <SectionTitle title="Budget & längd" />
                  <label htmlFor="budget" className="nordea-eyebrow block mb-1.5">
                    Total budget
                  </label>
                  <div className="relative">
                    <input
                      id="budget"
                      value={budgetInput}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="500 000"
                      inputMode="numeric"
                      className="nordea-input w-full h-11 pr-10 text-right tabular-nums text-base"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-nordea-text-tertiary">
                      kr
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="nordea-eyebrow">Kampanjlängd</span>
                      <span className="text-sm font-semibold text-nordea-blue">{duration} dagar</span>
                    </div>
                    <Slider value={[duration]} onValueChange={(v) => setDuration(v[0])} min={7} max={90} step={1} />
                    <div className="flex justify-between text-[11px] text-nordea-text-faint mt-1.5">
                      <span>7 dagar</span>
                      <span>90 dagar</span>
                    </div>
                  </div>
                </div>

                <div className="nordea-card p-5">
                  <SectionTitle
                    title="Kanalfördelning"
                    right={
                      <NordeaBadge tone={totalAllocation > 100 ? 'rose' : totalAllocation === 100 ? 'green' : 'neutral'}>
                        {totalAllocation} % fördelat
                      </NordeaBadge>
                    }
                  />
                  <div className="space-y-4">
                    {CHANNELS.map((ch) => {
                      const state = channelStates[ch.id];
                      const Icon = ch.icon;
                      return (
                        <div key={ch.id}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-opacity"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${ch.color} 12%, transparent)`,
                                color: ch.color,
                                opacity: state.enabled ? 1 : 0.4,
                              }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${state.enabled ? 'text-nordea-text' : 'text-nordea-text-faint'}`}>
                                  {ch.label}
                                </span>
                                <span className={`text-sm tabular-nums ${state.enabled ? 'text-nordea-blue font-semibold' : 'text-nordea-text-faint'}`}>
                                  {state.enabled ? `${state.allocation} %` : 'Av'}
                                </span>
                              </div>
                              <div className="text-[11px] text-nordea-text-tertiary">
                                CPM {ch.cpm} kr · CTR {String(ch.ctr).replace('.', ',')} %
                              </div>
                            </div>
                            <Switch checked={state.enabled} onCheckedChange={() => toggleChannel(ch.id)} />
                          </div>
                          {state.enabled && (
                            <Slider
                              className="mt-2.5 pl-11"
                              value={[state.allocation]}
                              onValueChange={(v) => setAllocation(ch.id, v[0])}
                              min={0}
                              max={100}
                              step={1}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="nordea-card p-5">
                  <SectionTitle title="Målgrupp" right={<NordeaBadge tone="cobalt">Sverige</NordeaBadge>} />
                  <label htmlFor="audience" className="nordea-eyebrow block mb-1.5">
                    Målgruppsstorlek
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nordea-text-tertiary" />
                    <input
                      id="audience"
                      value={audienceInput}
                      onChange={(e) => handleAudienceChange(e.target.value)}
                      placeholder="500 000"
                      inputMode="numeric"
                      className="nordea-input w-full pl-9 text-right tabular-nums"
                    />
                  </div>

                  <div className="mt-4">
                    <span className="nordea-eyebrow block mb-1.5">Ålder</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={ageMin}
                        onChange={(e) => setAgeMin(Math.max(13, Math.min(Number(e.target.value), ageMax - 1)))}
                        className="nordea-input w-20 text-center tabular-nums"
                        min={13}
                        max={99}
                      />
                      <span className="text-nordea-text-faint">–</span>
                      <input
                        type="number"
                        value={ageMax}
                        onChange={(e) => setAgeMax(Math.max(ageMin + 1, Math.min(Number(e.target.value), 99)))}
                        className="nordea-input w-20 text-center tabular-nums"
                        min={13}
                        max={99}
                      />
                      <span className="text-xs text-nordea-text-tertiary">år</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Höger: prognos ── */}
              <div className="space-y-5 min-w-0">
                {/* Hero: räckvidd */}
                <div className="nordea-card p-6 overflow-hidden relative">
                  <div
                    aria-hidden
                    className="absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, var(--nordea-blue), transparent 70%)' }}
                  />
                  <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
                    <div>
                      <div className="nordea-eyebrow mb-2">Unik räckvidd</div>
                      <div className="flex items-baseline gap-3">
                        <span className="nordea-display text-5xl text-nordea-deep tabular-nums">
                          {formatNumber(uniqueReach)}
                        </span>
                        <span className="text-sm text-nordea-text-tertiary">personer</span>
                      </div>
                      <div className="mt-4 max-w-md">
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-nordea-text-tertiary">Andel av målgruppen</span>
                          <span className="tabular-nums font-semibold text-nordea-blue">
                            {formatPercent(reachPercentage)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-nordea-blue-soft overflow-hidden">
                          <div
                            className="h-full rounded-full bg-nordea-blue transition-all duration-500"
                            style={{ width: `${Math.min(100, reachPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 md:text-right">
                      <MiniStat label="CPM" value={formatCurrency(avgCPM)} />
                      <MiniStat label="CPC" value={formatCurrency(avgCPC)} />
                      <MiniStat label="Per dag" value={formatCurrency(duration > 0 ? allocatedBudget / duration : 0)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Visningar" value={formatNumber(totalImpressions)} sub="impressions totalt" icon={Eye} />
                  <StatCard label="Klick" value={formatNumber(totalClicks)} sub="estimerade" icon={MousePointerClick} />
                  <StatCard
                    label="Frekvens"
                    value={avgFrequency.toFixed(1).replace('.', ',')}
                    delta={avgFrequency > 8 ? 'hög' : undefined}
                    deltaTone="rose"
                    sub="visningar per person"
                    icon={Repeat}
                  />
                </div>

                {/* Budgetfördelning + detaljer */}
                <div className="nordea-card overflow-hidden">
                  <div className="px-5 pt-5">
                    <SectionTitle title="Per kanal" hint={`${formatCurrency(allocatedBudget)} av ${formatCurrency(budget)}`} />
                    {channelResults.length > 0 && (
                      <div className="flex h-3 rounded-full overflow-hidden bg-nordea-bg-hover mb-5">
                        {channelResults.map((r) => {
                          const ch = CHANNELS.find((c) => c.id === r.channelId)!;
                          return (
                            <div
                              key={r.channelId}
                              title={`${ch.label}: ${formatCurrency(r.budget)}`}
                              className="h-full transition-all duration-300 border-r-2 border-white last:border-r-0"
                              style={{ width: `${budget > 0 ? (r.budget / budget) * 100 : 0}%`, backgroundColor: ch.color }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {channelResults.length === 0 ? (
                    <div className="text-center py-12 text-nordea-text-tertiary">
                      <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Aktivera minst en kanal för att se prognosen</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-y border-nordea-hairline bg-nordea-bg/60">
                            {['Kanal', 'Budget', 'Visningar', 'Räckvidd', 'Klick', 'Frekvens'].map((h, i) => (
                              <th
                                key={h}
                                className={`py-2.5 px-4 nordea-eyebrow whitespace-nowrap font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {channelResults.map((result) => {
                            const ch = CHANNELS.find((c) => c.id === result.channelId)!;
                            const freqWarning = result.frequency > 8;
                            return (
                              <tr key={result.channelId} className="border-b border-nordea-hairline hover:bg-nordea-bg-hover transition-colors">
                                <td className="py-3 px-4 pl-5 whitespace-nowrap">
                                  <span className="flex items-center gap-2.5 font-medium text-nordea-text">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                                    {ch.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-nordea-text-secondary">{formatCurrency(result.budget)}</td>
                                <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-nordea-text-secondary">{formatNumber(result.impressions)}</td>
                                <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-nordea-text-secondary">{formatNumber(result.reach)}</td>
                                <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-nordea-text-secondary">{formatNumber(result.clicks)}</td>
                                <td className={`py-3 px-4 text-right whitespace-nowrap tabular-nums ${freqWarning ? 'text-nordea-amber font-semibold' : 'text-nordea-text-secondary'}`}>
                                  {result.frequency.toFixed(1).replace('.', ',')}
                                  {freqWarning && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="font-semibold text-nordea-text">
                            <td className="py-3 px-4 pl-5 whitespace-nowrap">Totalt (unikt)</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">{formatCurrency(allocatedBudget)}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">{formatNumber(totalImpressions)}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">{formatNumber(uniqueReach)}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">{formatNumber(totalClicks)}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">{avgFrequency.toFixed(1).replace('.', ',')}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="nordea-eyebrow text-[10px] mb-1">{label}</div>
      <div className="text-lg font-semibold text-nordea-text tabular-nums whitespace-nowrap">{value}</div>
    </div>
  );
}
