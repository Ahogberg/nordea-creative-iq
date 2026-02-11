'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Channel & objective definitions
// ---------------------------------------------------------------------------

type ChannelKey = 'linkedin' | 'meta' | 'tiktok' | 'display' | 'email';

interface ChannelConfig {
  label: string;
  maxHeadline: number;
  maxBody: number;
}

const CHANNELS: Record<ChannelKey, ChannelConfig> = {
  linkedin: { label: 'LinkedIn', maxHeadline: 150, maxBody: 600 },
  meta: { label: 'Meta/Instagram', maxHeadline: 40, maxBody: 125 },
  tiktok: { label: 'TikTok', maxHeadline: 30, maxBody: 100 },
  display: { label: 'Display', maxHeadline: 30, maxBody: 90 },
  email: { label: 'E-post', maxHeadline: 60, maxBody: 500 },
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
  subheadline: 'Vi hjälper dig förstå vad du har råd med \u2013 steg för steg',
  bodyCopy:
    'Att köpa sin första bostad är stort. Vi vet att det kan kännas överväldigande med amorteringskrav, kontantinsats och räntebindning. Därför har vi gjort det enkelt. Med vår bolånekalkylator får du svar på några minuter \u2013 utan förpliktelser.',
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
    <div className="group py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {label}
          </span>
          <p className="mt-1 text-sm text-gray-900 bg-[#FAFAFA] px-3 py-2 rounded-md">
            {value}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="mt-5 flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
          title="Kopiera"
        >
          {copied ? (
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thin tone bar
// ---------------------------------------------------------------------------

function ToneBar({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-gray-900' : score >= 70 ? 'bg-[#0000A0]' : 'bg-gray-400';

  return (
    <div className="h-[2px] w-full bg-gray-100 rounded-sm">
      <div
        className={`h-full rounded-sm ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function CopyStudioPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>('linkedin');
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveKey>('awareness');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<typeof mockGeneratedCopy | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleGenerate = () => {
    setIsGenerating(true);
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

  const channel = CHANNELS[selectedChannel];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Copy Studio</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Generera kanaloptimerad copy med Nordeas Tone of Voice
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ============================================================= */}
        {/* LEFT COLUMN - Input                                           */}
        {/* ============================================================= */}
        <div className="space-y-8">
          {/* Channel selector */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Kanal
            </p>
            <div className="flex flex-wrap gap-0">
              {(Object.entries(CHANNELS) as [ChannelKey, ChannelConfig][]).map(
                ([key, cfg]) => {
                  const isActive = selectedChannel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedChannel(key)}
                      className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                        isActive
                          ? 'text-[#0000A0] font-medium border-[#0000A0]'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                },
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Max headline {channel.maxHeadline} tecken / body {channel.maxBody} tecken
            </p>
          </div>

          {/* Objective selector */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Kampanjmål
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(OBJECTIVES) as [ObjectiveKey, string][]).map(
                ([key, label]) => {
                  const isActive = selectedObjective === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedObjective(key)}
                      className={`px-4 py-1.5 text-sm rounded-md border transition-colors ${
                        isActive
                          ? 'border-gray-900 text-gray-900 font-medium'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Topic & context */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Ämne & kontext
            </p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Beskriv ditt ämne, produkt eller kampanj..."
              className="w-full min-h-[120px] resize-none border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-11 text-sm font-medium bg-[#0000A0] hover:bg-[#000080] text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Genererar...' : 'Generera'}
          </button>
        </div>

        {/* ============================================================= */}
        {/* RIGHT COLUMN - Output                                         */}
        {/* ============================================================= */}
        <div className="space-y-6">
          {!generatedCopy && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-gray-400">
                Fyll i kanal, kampanjmål och ämne till vänster
                och klicka Generera för att komma igång.
              </p>
            </div>
          )}

          {isGenerating && !generatedCopy && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#0000A0] rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Genererar copy med Nordeas Tone of Voice...</p>
            </div>
          )}

          {generatedCopy && (
            <>
              {/* Generated copy header + Brand Fit */}
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Genererad copy
                </p>
                <span className="text-2xl font-semibold text-gray-900">
                  {generatedCopy.brandFitScore}
                </span>
              </div>

              {/* Copy fields */}
              <div className="divide-y divide-gray-100">
                <CopyField label="Rubrik" value={generatedCopy.headline} />
                <CopyField label="Underrubrik" value={generatedCopy.subheadline} />
                <CopyField label="Brödtext" value={generatedCopy.bodyCopy} />
                <CopyField label="CTA" value={generatedCopy.cta} />
                <CopyField label="Hashtags" value={generatedCopy.hashtags} />
              </div>

              {/* Tone of Voice Analysis */}
              <div className="pt-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                  Tone of Voice
                </p>
                <div className="space-y-3">
                  {TONE_LABELS.map(({ key, label }) => {
                    const score = generatedCopy.toneScores[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-40 flex-shrink-0">
                          {label}
                        </span>
                        <div className="flex-1">
                          <ToneBar score={score} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCopyAll}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {allCopied ? 'Kopierat!' : 'Kopiera allt'}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Generera om
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
