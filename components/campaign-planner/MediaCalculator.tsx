'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calculator,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { MediaCalculatorExport } from './MediaCalculatorExport';
import html2canvas from 'html2canvas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalculatorInputs {
  mode: 'budget' | 'goal';
  budget: number;
  goalType: 'impressions' | 'clicks' | 'reach';
  goalValue: number;
  cpm: number;
  ctr: number;
  frequencyCap: number;
  discrepancyRate: number;
}

interface CalculatorResults {
  grossImpressions: number;
  netImpressions: number;
  clicks: number;
  reach: number;
  cpc: number;
  frequency: number;
  requiredBudget: number;
  recommendedBudget: number;
  actualSpend: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

function calculate(inputs: CalculatorInputs): CalculatorResults {
  const { mode, budget, goalType, goalValue, cpm, ctr, frequencyCap, discrepancyRate } = inputs;

  let grossImpressions: number;
  let requiredBudget: number;

  if (mode === 'budget') {
    grossImpressions = (budget / cpm) * 1000;
    requiredBudget = budget;
  } else {
    if (goalType === 'impressions') {
      grossImpressions = goalValue / (1 - discrepancyRate / 100);
    } else if (goalType === 'clicks') {
      const impressionsNeeded = goalValue / (ctr / 100);
      grossImpressions = impressionsNeeded / (1 - discrepancyRate / 100);
    } else {
      // reach
      const impressionsNeeded = goalValue * frequencyCap;
      grossImpressions = impressionsNeeded / (1 - discrepancyRate / 100);
    }
    requiredBudget = (grossImpressions / 1000) * cpm;
  }

  const netImpressions = grossImpressions * (1 - discrepancyRate / 100);
  const clicks = netImpressions * (ctr / 100);
  const reach = netImpressions / frequencyCap;
  const cpc = clicks > 0 ? requiredBudget / clicks : 0;
  const frequency = reach > 0 ? netImpressions / reach : 0;
  const actualSpend = requiredBudget * (1 - discrepancyRate / 100);
  const recommendedBudget = requiredBudget * 1.1;

  return {
    grossImpressions: Math.round(grossImpressions),
    netImpressions: Math.round(netImpressions),
    clicks: Math.round(clicks),
    reach: Math.round(reach),
    cpc: Math.round(cpc * 100) / 100,
    frequency: Math.round(frequency * 10) / 10,
    requiredBudget: Math.round(requiredBudget),
    recommendedBudget: Math.round(recommendedBudget),
    actualSpend: Math.round(actualSpend),
  };
}

// ---------------------------------------------------------------------------
// Tooltip helper
// ---------------------------------------------------------------------------

const tooltips: Record<string, string> = {
  cpm: 'Cost Per Mille \u2013 kostnaden f\u00f6r 1\u2009000 visningar',
  ctr: 'Click-Through Rate \u2013 andelen som klickar p\u00e5 annonsen',
  frequency: 'Max antal g\u00e5nger samma person ser annonsen',
  discrepancy: 'Skillnaden mellan k\u00f6pta och faktiskt levererade impressions (normalt 5\u201315%)',
  reach: 'Antal unika personer som ser annonsen',
};

function InfoTip({ term }: { term: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex ml-1 text-gray-400 hover:text-gray-600">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {tooltips[term]}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaCalculator() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Inputs
  const [calcMode, setCalcMode] = useState<'budget' | 'goal'>('budget');
  const [budget, setBudget] = useState(500000);
  const [budgetInput, setBudgetInput] = useState('500 000');
  const [goalType, setGoalType] = useState<'impressions' | 'clicks' | 'reach'>('impressions');
  const [goalValue, setGoalValue] = useState(5000000);
  const [goalInput, setGoalInput] = useState('5 000 000');
  const [cpm, setCpm] = useState(95);
  const [ctr, setCtr] = useState(1.2);
  const [frequencyCap, setFrequencyCap] = useState(3);
  const [discrepancyRate, setDiscrepancyRate] = useState(10);

  // Number input handler
  const handleNumInput = useCallback(
    (raw: string, setter: (n: number) => void, displaySetter: (s: string) => void) => {
      const cleaned = raw.replace(/\s/g, '').replace(/[^0-9]/g, '');
      const num = parseInt(cleaned, 10) || 0;
      setter(num);
      displaySetter(num > 0 ? formatNumber(num) : '');
    },
    []
  );

  // Results
  const results = useMemo(
    () =>
      calculate({
        mode: calcMode,
        budget,
        goalType,
        goalValue,
        cpm,
        ctr,
        frequencyCap,
        discrepancyRate,
      }),
    [calcMode, budget, goalType, goalValue, cpm, ctr, frequencyCap, discrepancyRate]
  );

  // ---- Export: Copy text ----
  const handleCopyText = useCallback(() => {
    const displayBudget = calcMode === 'budget' ? budget : results.requiredBudget;
    const text = `Mediaberäkning - Nordea CreativeIQ
================================

Budget: ${formatNumber(displayBudget)} SEK
CPM: ${cpm} SEK | CTR: ${ctr}% | Frequency: ${frequencyCap} | Discrepancy: ${discrepancyRate}%

Resultat:
- Impressions: ${formatNumber(results.grossImpressions)}
- Klick: ${formatNumber(results.clicks)}
- Räckvidd: ${formatNumber(results.reach)}
- CPC: ${results.cpc.toFixed(2)} SEK
- Frekvens: ${results.frequency.toFixed(1)}x

Efter discrepancy (${discrepancyRate}%): ${formatNumber(results.netImpressions)} levererade impressions
Faktisk kostnad: ${formatNumber(results.actualSpend)} SEK`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [calcMode, budget, cpm, ctr, frequencyCap, discrepancyRate, results]);

  // ---- Export: CSV ----
  const handleExportCSV = useCallback(() => {
    const displayBudget = calcMode === 'budget' ? budget : results.requiredBudget;
    const rows = [
      ['Metric', 'Värde', 'Enhet'],
      ['Budget', String(displayBudget), 'SEK'],
      ['CPM', String(cpm), 'SEK'],
      ['CTR', String(ctr), '%'],
      ['Frequency Cap', String(frequencyCap), 'ggr'],
      ['Discrepancy', String(discrepancyRate), '%'],
      ['Impressions (brutto)', String(results.grossImpressions), 'st'],
      ['Impressions (netto)', String(results.netImpressions), 'st'],
      ['Klick', String(results.clicks), 'st'],
      ['Räckvidd', String(results.reach), 'st'],
      ['CPC', results.cpc.toFixed(2), 'SEK'],
      ['Frekvens', results.frequency.toFixed(1), 'x'],
      ['Faktisk kostnad', String(results.actualSpend), 'SEK'],
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediaberakning-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [calcMode, budget, cpm, ctr, frequencyCap, discrepancyRate, results]);

  // ---- Export: Image ----
  const handleDownloadImage = useCallback(async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `mediaberakning-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // ---- Metric card ----
  const ResultMetric = ({ label, value, large }: { label: string; value: string; large?: boolean }) => (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-900 ${large ? 'text-2xl' : 'text-lg'}`}>{value}</p>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Mode selector */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0000A0]" />
              Mediakalkylator
            </CardTitle>
            <p className="text-sm text-gray-500">
              Beräkna räckvidd från budget eller budget från mål
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCalcMode('budget')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  calcMode === 'budget'
                    ? 'bg-[#0000A0] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Budget &rarr; Resultat
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('goal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  calcMode === 'goal'
                    ? 'bg-[#0000A0] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mål &rarr; Budget
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Parameters */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Parametrar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Budget or Goal */}
              {calcMode === 'budget' ? (
                <div className="space-y-2">
                  <Label>Budget (SEK)</Label>
                  <div className="relative">
                    <Input
                      value={budgetInput}
                      onChange={(e) => handleNumInput(e.target.value, setBudget, setBudgetInput)}
                      placeholder="500 000"
                      className="text-right font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">SEK</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Måltyp</Label>
                    <div className="flex gap-2">
                      {[
                        { id: 'impressions' as const, label: 'Impressions' },
                        { id: 'clicks' as const, label: 'Klick' },
                        { id: 'reach' as const, label: 'Räckvidd' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setGoalType(opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            goalType === opt.id
                              ? 'bg-[#0000A0] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Målvärde</Label>
                    <Input
                      value={goalInput}
                      onChange={(e) => handleNumInput(e.target.value, setGoalValue, setGoalInput)}
                      placeholder="5 000 000"
                      className="text-right font-mono"
                    />
                  </div>
                </>
              )}

              {/* CPM */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  CPM <InfoTip term="cpm" />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={cpm}
                    onChange={(e) => setCpm(Math.max(5, Math.min(1000, Number(e.target.value))))}
                    min={5}
                    max={1000}
                    className="text-right font-mono pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">SEK</span>
                </div>
              </div>

              {/* CTR */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  CTR <InfoTip term="ctr" />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={ctr}
                    onChange={(e) => setCtr(Math.max(0.01, Math.min(10, Number(e.target.value))))}
                    min={0.01}
                    max={10}
                    step={0.1}
                    className="text-right font-mono pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>

              {/* Frequency Cap */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  Frequency Cap <InfoTip term="frequency" />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={frequencyCap}
                    onChange={(e) => setFrequencyCap(Math.max(1, Math.min(50, Number(e.target.value))))}
                    min={1}
                    max={50}
                    className="text-right font-mono pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">ggr</span>
                </div>
              </div>

              {/* Discrepancy Rate */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  Discrepancy Rate <InfoTip term="discrepancy" />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={discrepancyRate}
                    onChange={(e) => setDiscrepancyRate(Math.max(0, Math.min(50, Number(e.target.value))))}
                    min={0}
                    max={50}
                    className="text-right font-mono pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Results */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Resultat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calcMode === 'goal' && (
                <>
                  <div className="bg-[#0000A0]/5 rounded-xl p-5 mb-2">
                    <p className="text-xs text-gray-500 mb-1">Budget krävs</p>
                    <p className="text-3xl font-bold text-[#0000A0]">{formatNumber(results.requiredBudget)} SEK</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Rekommenderad budget (med 10% buffert):{' '}
                      <span className="font-semibold text-gray-700">{formatNumber(results.recommendedBudget)} SEK</span>
                    </p>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <p className="text-xs text-gray-500 font-medium">Med denna budget får du:</p>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <ResultMetric label="Impressions" value={formatNumber(results.grossImpressions)} large />
                <ResultMetric label="Klick" value={formatNumber(results.clicks)} large />
                <ResultMetric
                  label="Räckvidd (unik)"
                  value={formatNumber(results.reach)}
                />
                <ResultMetric
                  label="Kostnad per klick"
                  value={`${results.cpc.toFixed(2)} SEK`}
                />
                <ResultMetric
                  label="Genomsnittlig frekvens"
                  value={`${results.frequency.toFixed(1)}x`}
                />
                {calcMode === 'budget' && (
                  <ResultMetric
                    label="Faktisk kostnad"
                    value={`${formatNumber(results.actualSpend)} SEK`}
                  />
                )}
              </div>

              {/* Discrepancy section */}
              <div className="h-px bg-gray-100 mt-2" />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Efter discrepancy ({discrepancyRate}%)
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Levererade impressions</span>
                  <span className="font-bold text-amber-900">{formatNumber(results.netImpressions)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-amber-700">Faktisk kostnad</span>
                  <span className="font-bold text-amber-900">{formatNumber(results.actualSpend)} SEK</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleCopyText}>
            <Copy className="w-4 h-4" />
            {copied ? 'Kopierat!' : 'Kopiera resultat'}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-4 h-4" />
            Exportera till Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage}>
            <Download className="w-4 h-4" />
            Ladda ner bild
          </Button>
        </div>

        {/* Hidden export view */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <MediaCalculatorExport
            ref={exportRef}
            mode={calcMode}
            budget={budget}
            cpm={cpm}
            ctr={ctr}
            frequencyCap={frequencyCap}
            discrepancyRate={discrepancyRate}
            results={results}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
