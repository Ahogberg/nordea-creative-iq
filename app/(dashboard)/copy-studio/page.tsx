'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Copy, RefreshCw, BookmarkPlus, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Channel & objective definitions
// ---------------------------------------------------------------------------

type ChannelKey = 'linkedin' | 'meta' | 'tiktok' | 'display' | 'email';

interface ChannelConfig {
  label: string;
  icon: string;
  maxHeadline: number;
  maxBody: number;
}

const CHANNELS: Record<ChannelKey, ChannelConfig> = {
  linkedin: { label: 'LinkedIn', icon: '💼', maxHeadline: 150, maxBody: 600 },
  meta: { label: 'Meta/Instagram', icon: '📱', maxHeadline: 40, maxBody: 125 },
  tiktok: { label: 'TikTok', icon: '🎵', maxHeadline: 30, maxBody: 100 },
  display: { label: 'Display', icon: '🖥️', maxHeadline: 30, maxBody: 90 },
  email: { label: 'E-post', icon: '📧', maxHeadline: 60, maxBody: 500 },
};

type ObjectiveKey = 'awareness' | 'consideration' | 'conversion' | 'retention';

const OBJECTIVES: Record<ObjectiveKey, string> = {
  awareness: 'Varumärkeskännedom',
  consideration: 'Övervägande',
  conversion: 'Konvertering',
  retention: 'Lojalitet',
};

// ---------------------------------------------------------------------------
// Mock generated copy
// ---------------------------------------------------------------------------

const mockGeneratedCopy = {
  headline: 'Ditt första boende börjar med en enkel kalkyl',
  subheadline: 'Vi hjälper dig förstå vad du har råd med – steg för steg',
  bodyCopy:
    'Att köpa sin första bostad är stort. Vi vet att det kan kännas överväldigande med amorteringskrav, kontantinsats och räntebindning. Därför har vi gjort det enkelt. Med vår bolånekalkylator får du svar på några minuter – utan förpliktelser.',
  cta: 'Testa kalkylatorn',
  hashtags: '#Nordea #FörstaBostad #Bolån #TillsammansGörViDetMöjligt',
  brandFitScore: 87,
  toneScores: {
    humanWarm: 82,
    clearSimple: 91,
    confidentHumble: 78,
    forwardLooking: 85,
  },
};

// ---------------------------------------------------------------------------
// Tone of voice labels
// ---------------------------------------------------------------------------

const TONE_LABELS: { key: keyof typeof mockGeneratedCopy.toneScores; label: string }[] = [
  { key: 'humanWarm', label: 'Mänsklig & varm' },
  { key: 'clearSimple', label: 'Tydlig & enkel' },
  { key: 'confidentHumble', label: 'Självsäker men ödmjuk' },
  { key: 'forwardLooking', label: 'Framåtblickande' },
];

// ---------------------------------------------------------------------------
// Copyable field helper
// ---------------------------------------------------------------------------

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#0000A0]"
          title="Kopiera"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-sm text-gray-900 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function CopyStudioPage() {
  // Input state
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>('linkedin');
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveKey>('awareness');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Output state
  const [generatedCopy, setGeneratedCopy] = useState<typeof mockGeneratedCopy | null>(null);

  // Copy-all state
  const [allCopied, setAllCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setGeneratedCopy(mockGeneratedCopy);
      setIsGenerating(false);
    }, 1200);
  };

  const handleRegenerate = () => {
    setGeneratedCopy(null);
    handleGenerate();
  };

  const handleCopyAll = async () => {
    if (!generatedCopy) return;
    const fullText = [
      `Headline: ${generatedCopy.headline}`,
      `Subheadline: ${generatedCopy.subheadline}`,
      `Body: ${generatedCopy.bodyCopy}`,
      `CTA: ${generatedCopy.cta}`,
      `Hashtags: ${generatedCopy.hashtags}`,
    ].join('\n\n');
    await navigator.clipboard.writeText(fullText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1500);
  };

  // ---------------------------------------------------------------------------
  // Brand fit score colour helper
  // ---------------------------------------------------------------------------

  const brandFitColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // ---------------------------------------------------------------------------
  // Tone bar colour helper
  // ---------------------------------------------------------------------------

  const toneBarColor = (score: number) => {
    if (score >= 85) return '[&>[data-slot=progress-indicator]]:bg-green-500';
    if (score >= 70) return '[&>[data-slot=progress-indicator]]:bg-[#0000A0]';
    return '[&>[data-slot=progress-indicator]]:bg-yellow-500';
  };

  const channel = CHANNELS[selectedChannel];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Copy Studio</h1>
        <p className="text-gray-500 mt-1">
          Generera kanaloptimerad copy med Nordeas Tone of Voice
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================= */}
        {/* LEFT COLUMN - Input                                           */}
        {/* ============================================================= */}
        <div className="space-y-6">
          {/* Channel selector */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Välj kanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.entries(CHANNELS) as [ChannelKey, ChannelConfig][]).map(
                  ([key, cfg]) => {
                    const isActive = selectedChannel === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedChannel(key)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all text-center ${
                          isActive
                            ? 'border-[#0000A0] bg-blue-50/60 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{cfg.icon}</span>
                        <span
                          className={`text-sm font-medium ${
                            isActive ? 'text-[#0000A0]' : 'text-gray-700'
                          }`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          max {cfg.maxHeadline}/{cfg.maxBody} tecken
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>

          {/* Objective selector */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Kampanjmål</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(OBJECTIVES) as [ObjectiveKey, string][]).map(
                  ([key, label]) => {
                    const isActive = selectedObjective === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedObjective(key)}
                        className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? 'border-[#0000A0] bg-blue-50/60 text-[#0000A0] shadow-sm'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>

          {/* Topic & context */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ämne & kontext</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Beskriv ditt ämne, produkt eller kampanj..."
                className="min-h-[120px] resize-none"
              />
              <p className="mt-2 text-xs text-gray-400">
                Vald kanal: <strong>{channel.label}</strong> &middot; Max headline{' '}
                {channel.maxHeadline} tecken &middot; Max body {channel.maxBody} tecken
              </p>
            </CardContent>
          </Card>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-12 text-base font-semibold bg-[#0000A0] hover:bg-[#000080] text-white"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generera copy
              </>
            )}
          </Button>
        </div>

        {/* ============================================================= */}
        {/* RIGHT COLUMN - Output                                         */}
        {/* ============================================================= */}
        <div className="space-y-6">
          {!generatedCopy && !isGenerating && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#0000A0]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Redo att generera
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Fyll i kanal, kampanjmål och ämne till vänster och klicka
                  &quot;Generera copy&quot; för att komma igång.
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && !generatedCopy && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <RefreshCw className="w-10 h-10 text-[#0000A0] animate-spin mb-4" />
                <p className="text-sm text-gray-500">Genererar copy med Nordeas Tone of Voice...</p>
              </CardContent>
            </Card>
          )}

          {generatedCopy && (
            <>
              {/* Brand Fit Score + Generated copy */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Genererad copy</CardTitle>
                    <Badge
                      className={`text-sm px-3 py-1 ${brandFitColor(generatedCopy.brandFitScore)}`}
                    >
                      Brand Fit: {generatedCopy.brandFitScore}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CopyField label="Headline" value={generatedCopy.headline} />
                  <CopyField label="Subheadline" value={generatedCopy.subheadline} />
                  <CopyField label="Body Copy" value={generatedCopy.bodyCopy} />
                  <CopyField label="CTA" value={generatedCopy.cta} />
                  <CopyField label="Hashtags" value={generatedCopy.hashtags} />
                </CardContent>
              </Card>

              {/* Tone of Voice Analysis */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Tone of Voice-analys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TONE_LABELS.map(({ key, label }) => {
                    const score = generatedCopy.toneScores[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-700">{label}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {score}%
                          </span>
                        </div>
                        <Progress
                          value={score}
                          className={`h-2.5 ${toneBarColor(score)}`}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyAll}
                  variant="outline"
                  className="flex-1"
                >
                  {allCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Kopierat!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopiera allt
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generera om
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[#0000A0] text-[#0000A0] hover:bg-[#0000A0]/5"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Spara till bibliotek
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
