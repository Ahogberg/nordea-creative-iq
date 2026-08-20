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
import { mockLocalizations, type LocalizedResult } from '@/lib/constants/localization-mocks';
import { cn } from '@/lib/utils';

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

  const handleLocalize = async () => {
    if (targetMarkets.length === 0) return;
    setLoading(true);
    setResults([]);

    const localizedResults: LocalizedResult[] = [];

    for (const market of targetMarkets) {
      try {
        const res = await fetch('/api/localize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceMarket,
            targetMarket: market,
            content: { headline, body, cta },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.headline) {
            localizedResults.push({ market, ...data });
            continue;
          }
        }
      } catch (e) {
        console.error(`Localization failed for ${market}:`, e);
      }
      // Fallback to mock data
      const mock = mockLocalizations[market];
      if (mock) localizedResults.push(mock);
    }

    setResults(localizedResults);
    setLoading(false);
    if (localizedResults.length > 0) setExpandedMarket(localizedResults[0].market);
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
                <p className="text-gray-500">Välj målmarknader och klicka &ldquo;Lokalisera&rdquo; för att se resultat</p>
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
