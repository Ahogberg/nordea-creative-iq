'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { nordicMarkets } from '@/lib/constants/markets';
import { cn } from '@/lib/utils';

interface LocalizedResult {
  market: string;
  headline: string;
  body: string;
  cta: string;
  scores: { linguistic: number; cultural: number; legal: number };
  adaptations: Array<{
    type: string;
    original: string;
    adapted: string;
    reason: string;
  }>;
  alternativeHeadlines: Array<{ text: string; confidence: number }>;
}

const mockLocalizations: Record<string, LocalizedResult> = {
  dk: {
    market: 'dk',
    headline: 'Dit første hjem starter med en simpel beregning',
    body: 'At købe sin første bolig er en stor beslutning. Vi ved, det kan føles overvældende med afdragskrav, udbetaling og rentebinding. Derfor har vi gjort det nemt. Med vores boliglånsberegner får du svar på få minutter – helt uforpligtende.',
    cta: 'Prøv beregneren',
    scores: { linguistic: 92, cultural: 88, legal: 85 },
    adaptations: [
      { type: 'linguistic', original: 'bolånekalkylator', adapted: 'boliglånsberegner', reason: 'Dansk terminologi for bolåneverktyg' },
      { type: 'cultural', original: 'kontantinsats', adapted: 'udbetaling', reason: 'Dansk term for handpenning' },
      { type: 'tone', original: 'steg for steg', adapted: 'nemt', reason: 'Danskare foredrar enkel, direkt kommunikation' },
    ],
    alternativeHeadlines: [
      { text: 'Din første bolig? Start med en hurtig beregning', confidence: 88 },
      { text: 'Se hvad du har råd til – på få minutter', confidence: 82 },
    ],
  },
  no: {
    market: 'no',
    headline: 'Din første bolig starter med en enkel kalkulator',
    body: 'Å kjøpe sin første bolig er stort. Vi vet at det kan føles overveldende med avdragskrav, egenkapital og rentebinding. Derfor har vi gjort det enkelt. Med vår boliglånskalkulator får du svar på noen minutter – uten forpliktelser.',
    cta: 'Test kalkulatoren',
    scores: { linguistic: 95, cultural: 90, legal: 87 },
    adaptations: [
      { type: 'linguistic', original: 'kontantinsats', adapted: 'egenkapital', reason: 'Norsk term for handpenning' },
      { type: 'legal', original: 'amorteringskrav', adapted: 'avdragskrav', reason: 'Norsk juridisk terminologi' },
    ],
    alternativeHeadlines: [
      { text: 'Drømmer du om egen bolig? Start her', confidence: 85 },
      { text: 'Finn ut hva du har råd til – helt gratis', confidence: 80 },
    ],
  },
  fi: {
    market: 'fi',
    headline: 'Ensimmäinen kotisi alkaa yksinkertaisella laskelmalla',
    body: 'Ensimmäisen asunnon ostaminen on iso asia. Tiedämme, että se voi tuntua ylivoimaiselta lyhennysvaatimusten, käsirahan ja korkojen kanssa. Siksi olemme tehneet siitä helppoa. Asuntolainlaskurillamme saat vastaukset muutamassa minuutissa – ilman sitoumuksia.',
    cta: 'Kokeile laskuria',
    scores: { linguistic: 88, cultural: 92, legal: 90 },
    adaptations: [
      { type: 'cultural', original: 'steg for steg', adapted: 'yksinkertaisella', reason: 'Finsk kultur varderar rakhet och effektivitet' },
      { type: 'tone', original: 'Vi hjalper dig forsta', adapted: 'Olemme tehneet siitä helppoa', reason: 'Mer faktabaserad ton for finsk marknad' },
    ],
    alternativeHeadlines: [
      { text: 'Paljonko sinulla on varaa? Selvitä minuuteissa', confidence: 90 },
      { text: 'Ensiasunnon ostajan laskuri – nopea ja helppo', confidence: 86 },
    ],
  },
  ee: {
    market: 'ee',
    headline: 'Sinu esimene kodu algab lihtsa kalkulatsiooniga',
    body: 'Esimese kodu ostmine on suur samm. Teame, et see võib tunduda üle jõu käiv. Seetõttu oleme teinud selle lihtsaks. Meie kodulaenukalkulaatoriga saad vastused mõne minutiga – ilma kohustusteta.',
    cta: 'Proovi kalkulaatorit',
    scores: { linguistic: 85, cultural: 82, legal: 88 },
    adaptations: [
      { type: 'cultural', original: 'Nordea-specifik', adapted: 'digital-first approach', reason: 'Estland ar digitalt foregangsland' },
    ],
    alternativeHeadlines: [
      { text: 'Kui palju sa saad endale lubada? Uuri siit', confidence: 84 },
    ],
  },
  lt: {
    market: 'lt',
    headline: 'Jūsų pirmasis būstas prasideda nuo paprasto skaičiavimo',
    body: 'Pirmojo būsto pirkimas yra didelis žingsnis. Žinome, kad tai gali atrodyti sudėtinga. Todėl padarėme tai paprastą. Su mūsų būsto paskolos skaičiuokle gausite atsakymus per kelias minutes – be jokių įsipareigojimų.',
    cta: 'Išbandykite skaičiuoklę',
    scores: { linguistic: 83, cultural: 80, legal: 86 },
    adaptations: [
      { type: 'cultural', original: 'lagom approach', adapted: 'family-oriented messaging', reason: 'Litauisk kultur ar familjeorienterad' },
    ],
    alternativeHeadlines: [
      { text: 'Kiek galite sau leisti? Sužinokite čia', confidence: 82 },
    ],
  },
};

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

export default function LocalizationPage() {
  const [sourceMarket, setSourceMarket] = useState('se');
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [headline, setHeadline] = useState('Ditt forsta boende borjar med en enkel kalkyl');
  const [body, setBody] = useState(
    'Att kopa sin forsta bostad ar stort. Vi vet att det kan kannas overväldigande med amorteringskrav, kontantinsats och räntebindning. Darfor har vi gjort det enkelt. Med var bolånekalkylator far du svar pa nagra minuter – utan forpliktelser.'
  );
  const [cta, setCta] = useState('Testa kalkylatorn');
  const [results, setResults] = useState<LocalizedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);

  const toggleTarget = (marketId: string) => {
    if (marketId === sourceMarket) return;
    setTargetMarkets((prev) =>
      prev.includes(marketId) ? prev.filter((m) => m !== marketId) : [...prev, marketId]
    );
  };

  const handleLocalize = () => {
    if (targetMarkets.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      const res = targetMarkets.map((m) => mockLocalizations[m]).filter(Boolean);
      setResults(res);
      setLoading(false);
      if (res.length > 0) setExpandedMarket(res[0].market);
    }, 1500);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-medium text-gray-900">Lokalisering</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-3">Kallmarknad</label>
            <div className="flex flex-wrap gap-2">
              {nordicMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => {
                    setSourceMarket(market.id);
                    setTargetMarkets((prev) => prev.filter((m) => m !== market.id));
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm border rounded-md transition-colors',
                    sourceMarket === market.id
                      ? 'border-gray-900 text-gray-900 font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {market.flag} {market.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-gray-400 uppercase tracking-wide">Kallinnehall</label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rubrik</label>
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Brodtext</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">CTA</label>
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-3">Malmarknader</label>
            <div className="flex flex-wrap gap-2">
              {nordicMarkets
                .filter((m) => m.id !== sourceMarket)
                .map((market) => (
                  <button
                    key={market.id}
                    onClick={() => toggleTarget(market.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm border rounded-md transition-colors',
                      targetMarkets.includes(market.id)
                        ? 'border-[#0000A0] text-[#0000A0] font-medium'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}
                  >
                    {market.flag} {market.name}
                  </button>
                ))}
            </div>

            <button
              onClick={handleLocalize}
              disabled={targetMarkets.length === 0 || loading}
              className="mt-4 px-6 py-2 text-sm bg-[#0000A0] hover:bg-[#000080] text-white rounded-md transition-colors disabled:opacity-40"
            >
              {loading ? 'Lokaliserar...' : `Lokalisera (${targetMarkets.length})`}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-0">
          {results.length === 0 ? (
            <p className="text-sm text-gray-400 py-8">Valj malmarknader och klicka Lokalisera</p>
          ) : (
            results.map((result) => {
              const market = nordicMarkets.find((m) => m.id === result.market)!;
              const isExpanded = expandedMarket === result.market;
              const avgScore = Math.round(
                (result.scores.linguistic + result.scores.cultural + result.scores.legal) / 3
              );

              return (
                <div key={result.market} className="border-b border-gray-100 last:border-0">
                  <button
                    className="w-full py-3 flex items-center justify-between text-left hover:bg-[#FAFAFA] transition-colors"
                    onClick={() => setExpandedMarket(isExpanded ? null : result.market)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{market.flag}</span>
                      <span className="text-sm font-medium text-gray-900">{market.name}</span>
                      <span className="text-xs text-gray-400">{market.language}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-sm tabular-nums', scoreColor(avgScore))}>{avgScore}</span>
                      <ChevronDown className={cn('w-4 h-4 text-gray-300 transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pb-4 space-y-4">
                      {[
                        { label: 'Rubrik', value: result.headline, key: `${result.market}-h` },
                        { label: 'Brodtext', value: result.body, key: `${result.market}-b` },
                        { label: 'CTA', value: result.cta, key: `${result.market}-c` },
                      ].map((field) => (
                        <div key={field.key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{field.label}</span>
                            <button
                              onClick={() => copyToClipboard(field.value, field.key)}
                              className="text-gray-300 hover:text-gray-500"
                            >
                              {copiedField === field.key ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 bg-[#FAFAFA] rounded-md p-3">{field.value}</p>
                        </div>
                      ))}

                      {/* Scores */}
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-400">Kvalitet</span>
                        {[
                          { label: 'Sprak', value: result.scores.linguistic },
                          { label: 'Kultur', value: result.scores.cultural },
                          { label: 'Juridik', value: result.scores.legal },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-14">{s.label}</span>
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  s.value >= 85 ? 'bg-emerald-500' : s.value >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                )}
                                style={{ width: `${s.value}%` }}
                              />
                            </div>
                            <span className={cn('text-xs tabular-nums w-6 text-right', scoreColor(s.value))}>{s.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Adaptations */}
                      {result.adaptations.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-400">Anpassningar</span>
                          {result.adaptations.map((a, i) => (
                            <p key={i} className="text-xs text-gray-500 mt-1">
                              <span className="text-gray-400">{a.type}</span> — {a.reason}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Alt headlines */}
                      {result.alternativeHeadlines.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-400">Alternativa rubriker</span>
                          {result.alternativeHeadlines.map((alt, i) => (
                            <div key={i} className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-600">{alt.text}</p>
                              <span className="text-xs text-gray-400 tabular-nums ml-3">{alt.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
