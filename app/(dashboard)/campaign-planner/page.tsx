'use client';

import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface Channel {
  id: string;
  label: string;
  cpm: number;
  ctr: number; // percentage, e.g. 0.8 means 0.8%
  reachRate: number;
}

const CHANNELS: Channel[] = [
  { id: 'linkedin', label: 'LinkedIn', cpm: 180, ctr: 0.8, reachRate: 0.65 },
  { id: 'meta', label: 'Meta/Instagram', cpm: 95, ctr: 1.2, reachRate: 0.72 },
  { id: 'display', label: 'Display/Programmatic', cpm: 45, ctr: 0.15, reachRate: 0.85 },
  { id: 'youtube', label: 'YouTube', cpm: 120, ctr: 0.5, reachRate: 0.58 },
  { id: 'tiktok', label: 'TikTok', cpm: 85, ctr: 1.5, reachRate: 0.68 },
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

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kampanjplanerare</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Planera budget, kanalfordelning och prognostisera kampanjresultat
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:border-gray-300 transition-colors">
            Exportera PDF
          </button>
          <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:border-gray-300 transition-colors">
            Spara kampanj
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="pt-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-600">{w}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 pt-8">
        {/* LEFT COLUMN: Inputs */}
        <div className="xl:col-span-1 space-y-8">
          {/* Budget & Duration */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Budget & varaktighet</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="budget" className="block text-sm text-gray-600 mb-1">Total budget (SEK)</label>
                <input
                  id="budget"
                  type="text"
                  value={budgetInput}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  placeholder="500 000"
                  className="w-full px-3 py-2 text-sm text-right font-mono border border-gray-100 rounded-md focus:outline-none focus:border-[#0000A0] transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Kampanjlängd</label>
                  <span className="text-sm font-mono text-gray-900">{duration} dagar</span>
                </div>
                <input
                  type="range"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={7}
                  max={90}
                  step={1}
                  className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#0000A0]"
                />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                  <span>7 dagar</span>
                  <span>90 dagar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Mixer */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Kanalfordelning</h2>
              <span className={`text-xs font-mono ${totalAllocation > 100 ? 'text-red-500' : 'text-gray-400'}`}>
                {totalAllocation}% fordelat
              </span>
            </div>
            <table className="w-full">
              <tbody>
                {CHANNELS.map((ch) => {
                  const state = channelStates[ch.id];
                  return (
                    <tr key={ch.id} className="border-b border-gray-50">
                      <td className="py-3 pr-2 w-5">
                        <input
                          type="checkbox"
                          checked={state.enabled}
                          onChange={() => toggleChannel(ch.id)}
                          className="rounded-sm border-gray-200 text-[#0000A0] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0000A0]"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-sm ${state.enabled ? 'text-gray-900' : 'text-gray-300'}`}>
                          {ch.label}
                        </span>
                        {state.enabled && (
                          <span className="text-[10px] text-gray-300 ml-2">CPM {ch.cpm}</span>
                        )}
                      </td>
                      <td className="py-3 w-28">
                        {state.enabled && (
                          <input
                            type="range"
                            value={state.allocation}
                            onChange={(e) => setAllocation(ch.id, Number(e.target.value))}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#0000A0]"
                          />
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right w-12">
                        <span className={`text-xs font-mono ${state.enabled ? 'text-gray-600' : 'text-gray-300'}`}>
                          {state.enabled ? `${state.allocation}%` : '--'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audience Config */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Målgrupp</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="audience" className="block text-sm text-gray-600 mb-1">Målgruppsstorlek</label>
                <input
                  id="audience"
                  type="text"
                  value={audienceInput}
                  onChange={(e) => handleAudienceChange(e.target.value)}
                  placeholder="500 000"
                  className="w-full px-3 py-2 text-sm text-right font-mono border border-gray-100 rounded-md focus:outline-none focus:border-[#0000A0] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Geografi</label>
                <div className="flex flex-wrap gap-1.5">
                  {GEOGRAPHIES.map((geo) => {
                    const isSelected = selectedGeos.includes(geo.code);
                    return (
                      <button
                        key={geo.code}
                        type="button"
                        onClick={() => toggleGeo(geo.code)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                          isSelected
                            ? 'border-[#0000A0] text-[#0000A0] bg-white'
                            : 'border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {geo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Åldersintervall</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ageMin}
                    onChange={(e) => setAgeMin(Math.max(13, Math.min(Number(e.target.value), ageMax - 1)))}
                    className="w-16 px-2 py-1.5 text-sm text-center font-mono border border-gray-100 rounded-md focus:outline-none focus:border-[#0000A0]"
                    min={13}
                    max={99}
                  />
                  <span className="text-gray-300 text-xs">--</span>
                  <input
                    type="number"
                    value={ageMax}
                    onChange={(e) => setAgeMax(Math.max(ageMin + 1, Math.min(Number(e.target.value), 99)))}
                    className="w-16 px-2 py-1.5 text-sm text-center font-mono border border-gray-100 rounded-md focus:outline-none focus:border-[#0000A0]"
                    min={13}
                    max={99}
                  />
                  <span className="text-xs text-gray-300">ar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Forecast & Breakdown */}
        <div className="xl:col-span-2 space-y-8">
          {/* Forecast Results - Key-value data table */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Prognos</h2>
            <div className="border border-gray-100 rounded-md">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">Räckvidd</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatNumber(uniqueReach)}</td>
                    <td className="py-2.5 px-4 text-gray-500">Frekvens</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{avgFrequency.toFixed(1)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">Visningar</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatNumber(totalImpressions)}</td>
                    <td className="py-2.5 px-4 text-gray-500">CPM</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatCurrency(avgCPM)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">Klick</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatNumber(totalClicks)}</td>
                    <td className="py-2.5 px-4 text-gray-500">CPC</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatCurrency(avgCPC)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-gray-500">Räckvidd %</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatPercent(reachPercentage)}</td>
                    <td className="py-2.5 px-4 text-gray-500">Daglig budget</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-900">{formatCurrency(duration > 0 ? budget / duration : 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Channel Breakdown Table */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Kanalfordelning - detaljer</h2>
            {channelResults.length === 0 ? (
              <p className="text-sm text-gray-300 py-8 text-center">Aktivera minst en kanal for att se prognos</p>
            ) : (
              <div className="border border-gray-100 rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Kanal</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Budget</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Visningar</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Räckvidd</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Klick</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Frekvens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelResults.map((result) => {
                      const ch = CHANNELS.find((c) => c.id === result.channelId)!;
                      const freqWarning = result.frequency > 8;
                      return (
                        <tr
                          key={result.channelId}
                          className="border-b border-gray-50"
                        >
                          <td className="py-2.5 px-4 text-gray-900">
                            {ch.label}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-700">
                            {formatCurrency(result.budget)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-700">
                            {formatNumber(result.impressions)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-700">
                            {formatNumber(result.reach)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-700">
                            {formatNumber(result.clicks)}
                          </td>
                          <td className={`py-2.5 px-4 text-right font-mono ${freqWarning ? 'text-yellow-600' : 'text-gray-700'}`}>
                            {result.frequency.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td className="py-2.5 px-4 text-gray-900 font-medium">Totalt</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                        {formatCurrency(channelResults.reduce((s, r) => s + r.budget, 0))}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                        {formatNumber(totalImpressions)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                        {formatNumber(uniqueReach)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                        {formatNumber(totalClicks)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                        {avgFrequency.toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
