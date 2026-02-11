'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
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
      { type: 'linguistic', original: 'bolånekalkylator', adapted: 'boliglånsberegner', reason: 'Dansk terminologi för bolåneverktyg' },
      { type: 'cultural', original: 'kontantinsats', adapted: 'udbetaling', reason: 'Dansk term för handpenning' },
      { type: 'tone', original: 'steg för steg', adapted: 'nemt', reason: 'Danskare föredrar enkel, direkt kommunikation' },
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
      { type: 'linguistic', original: 'kontantinsats', adapted: 'egenkapital', reason: 'Norsk term för handpenning' },
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
      { type: 'cultural', original: 'steg för steg', adapted: 'yksinkertaisella', reason: 'Finsk kultur värderar rakhet och effektivitet' },
      { type: 'tone', original: 'Vi hjälper dig förstå', adapted: 'Olemme tehneet siitä helppoa', reason: 'Mer faktabaserad ton för finsk marknad' },
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
      { type: 'cultural', original: 'Nordea-specifik', adapted: 'digital-first approach', reason: 'Estland är digitalt föregångsland – betonar digital enkelhet' },
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
      { type: 'cultural', original: 'lagom approach', adapted: 'family-oriented messaging', reason: 'Litauisk kultur är familjeorienterad' },
    ],
    alternativeHeadlines: [
      { text: 'Kiek galite sau leisti? Sužinokite čia', confidence: 82 },
    ],
  },
};

export default function LocalizationPage() {
  const [sourceMarket, setSourceMarket] = useState('se');
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [headline, setHeadline] = useState('Ditt första boende börjar med en enkel kalkyl');
  const [body, setBody] = useState(
    'Att köpa sin första bostad är stort. Vi vet att det kan kännas överväldigande med amorteringskrav, kontantinsats och räntebindning. Därför har vi gjort det enkelt. Med vår bolånekalkylator får du svar på några minuter – utan förpliktelser.'
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
      const res = targetMarkets
        .map((m) => mockLocalizations[m])
        .filter(Boolean);
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

  const getScoreColor = (score: number) =>
    score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lokalisering</h1>
        <p className="text-gray-500 mt-1">Anpassa innehåll för nordiska och baltiska marknader</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-6">
          {/* Source Market */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Källmarknad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {nordicMarkets.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => {
                      setSourceMarket(market.id);
                      setTargetMarkets((prev) => prev.filter((m) => m !== market.id));
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all text-sm',
                      sourceMarket === market.id
                        ? 'border-[#0000A0] bg-blue-50 text-[#0000A0] font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="text-xl block mb-1">{market.flag}</span>
                    {market.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Input */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Källinnehåll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rubrik</Label>
                <Textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Brödtext</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>CTA</Label>
                <Textarea value={cta} onChange={(e) => setCta(e.target.value)} rows={1} />
              </div>
            </CardContent>
          </Card>

          {/* Target Markets */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Målmarknader</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {nordicMarkets
                  .filter((m) => m.id !== sourceMarket)
                  .map((market) => (
                    <button
                      key={market.id}
                      onClick={() => toggleTarget(market.id)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all text-sm',
                        targetMarkets.includes(market.id)
                          ? 'border-[#0000A0] bg-blue-50 text-[#0000A0] font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="text-xl block mb-1">{market.flag}</span>
                      {market.name}
                    </button>
                  ))}
              </div>

              <Button
                onClick={handleLocalize}
                disabled={targetMarkets.length === 0 || loading}
                className="w-full mt-4 bg-[#0000A0] hover:bg-[#000080]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lokaliserar...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Lokalisera till {targetMarkets.length} marknad{targetMarkets.length !== 1 ? 'er' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Välj målmarknader och klicka "Lokalisera" för att se resultat</p>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => {
              const market = nordicMarkets.find((m) => m.id === result.market)!;
              const isExpanded = expandedMarket === result.market;
              const avgScore = Math.round(
                (result.scores.linguistic + result.scores.cultural + result.scores.legal) / 3
              );

              return (
                <Card key={result.market} className="border-0 shadow-sm">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedMarket(isExpanded ? null : result.market)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{market.flag}</span>
                      <div>
                        <p className="font-medium">{market.name}</p>
                        <p className="text-xs text-gray-500">{market.language}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'text-xs',
                          avgScore >= 85
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {avgScore}/100
                      </Badge>
                      <ChevronRight
                        className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      {/* Localized content */}
                      {[
                        { label: 'Rubrik', value: result.headline, key: `${result.market}-h` },
                        { label: 'Brödtext', value: result.body, key: `${result.market}-b` },
                        { label: 'CTA', value: result.cta, key: `${result.market}-c` },
                      ].map((field) => (
                        <div key={field.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-500">{field.label}</Label>
                            <button
                              onClick={() => copyToClipboard(field.value, field.key)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedField === field.key ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm bg-gray-50 rounded-lg p-3">{field.value}</p>
                        </div>
                      ))}

                      {/* Quality Scores */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Kvalitetspoäng</Label>
                        {[
                          { label: 'Språklig precision', value: result.scores.linguistic },
                          { label: 'Kulturell passform', value: result.scores.cultural },
                          { label: 'Juridisk efterlevnad', value: result.scores.legal },
                        ].map((score) => (
                          <div key={score.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 w-36">{score.label}</span>
                            <Progress value={score.value} className="flex-1 h-2" />
                            <span className={cn('text-xs font-medium w-8', getScoreColor(score.value))}>
                              {score.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Adaptations */}
                      {result.adaptations.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Anpassningar</Label>
                          {result.adaptations.map((a, i) => (
                            <div key={i} className="bg-blue-50 rounded-lg p-3 text-xs">
                              <Badge variant="outline" className="text-xs mb-1">
                                {a.type}
                              </Badge>
                              <p className="text-gray-600 mt-1">{a.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Alternative Headlines */}
                      {result.alternativeHeadlines.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Alternativa rubriker</Label>
                          {result.alternativeHeadlines.map((alt, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                            >
                              <p className="text-sm">{alt.text}</p>
                              <Badge variant="outline" className="text-xs ml-2">
                                {alt.confidence}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
