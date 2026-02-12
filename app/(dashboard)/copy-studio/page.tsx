'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
  Send,
  Loader2,
  Wand2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChannelKey = 'linkedin' | 'meta' | 'tiktok' | 'display' | 'email';
type ObjectiveKey = 'awareness' | 'consideration' | 'conversion' | 'retention';

interface ChannelConfig {
  label: string;
  maxHeadline: number;
  maxBody: number;
}

interface CopyVariant {
  id: string;
  angle: string;
  headline: string;
  subheadline: string;
  bodyCopy: string;
  cta: string;
  hashtags: string | null;
  brandFitScore: number;
  toneScores: {
    humanWarm: number;
    clearSimple: number;
    confidentHumble: number;
    forwardLooking: number;
  };
}

interface ImprovementSuggestion {
  severity: 'high' | 'medium' | 'low';
  field: string;
  original: string;
  issue: string;
  suggestion: string;
}

interface ImprovedCopy {
  headline: string;
  body: string;
  cta: string;
  toneScores: {
    humanWarm: number;
    clearSimple: number;
    confidentHumble: number;
    forwardLooking: number;
  };
  suggestions: ImprovementSuggestion[];
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  age_min: number;
  age_max: number;
  traits: string[];
  pain_points: string[];
  system_prompt: string | null;
  response_style: string;
}

interface PersonaReaction {
  firstImpression: string;
  wouldClick: number;
  objections: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'persona';
  content: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNELS: Record<ChannelKey, ChannelConfig> = {
  linkedin: { label: 'LinkedIn', maxHeadline: 150, maxBody: 600 },
  meta: { label: 'Meta/Instagram', maxHeadline: 40, maxBody: 125 },
  tiktok: { label: 'TikTok', maxHeadline: 30, maxBody: 100 },
  display: { label: 'Display', maxHeadline: 30, maxBody: 90 },
  email: { label: 'E-post', maxHeadline: 60, maxBody: 500 },
};

const OBJECTIVES: Record<ObjectiveKey, string> = {
  awareness: 'Varumärkeskännedom',
  consideration: 'Övervägande',
  conversion: 'Konvertering',
  retention: 'Lojalitet',
};

const TONE_LABELS = [
  { key: 'humanWarm', label: 'Mänsklig & varm' },
  { key: 'clearSimple', label: 'Tydlig & enkel' },
  { key: 'confidentHumble', label: 'Självsäker men ödmjuk' },
  { key: 'forwardLooking', label: 'Framåtblickande' },
] as const;

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

const generateMockVariants = (): CopyVariant[] => [
  {
    id: '1',
    angle: 'Emotionell',
    headline: 'Ditt första hem väntar på dig',
    subheadline: 'Vi hjälper dig hela vägen – från dröm till nyckel',
    bodyCopy: 'Att köpa sin första bostad är en av livets största milstolpar. Vi förstår att det kan kännas överväldigande. Därför finns vi här för att guida dig genom varje steg, med tydliga råd och inga dolda överraskningar.',
    cta: 'Börja din resa',
    hashtags: '#Nordea #FörstaBostad #Bolån',
    brandFitScore: 87,
    toneScores: { humanWarm: 92, clearSimple: 85, confidentHumble: 78, forwardLooking: 88 },
  },
  {
    id: '2',
    angle: 'Rationell',
    headline: 'Räkna ut vad du har råd med på 2 minuter',
    subheadline: 'Vår bolånekalkyl ger dig svar direkt – utan förpliktelser',
    bodyCopy: 'Kontantinsats, amortering, räntebindning – det finns mycket att hålla koll på. Vår kalkylator hjälper dig få en tydlig bild av din ekonomi, så att du kan fatta ett välgrundat beslut.',
    cta: 'Testa kalkylatorn',
    hashtags: '#Nordea #Bolånekalkyl #Privatekonomi',
    brandFitScore: 82,
    toneScores: { humanWarm: 72, clearSimple: 94, confidentHumble: 85, forwardLooking: 78 },
  },
  {
    id: '3',
    angle: 'Handlingsfokuserad',
    headline: 'Starta din bostadsresa idag',
    subheadline: 'Tre enkla steg till ditt bolånebesked',
    bodyCopy: 'Sluta fundera, börja agera. Fyll i vår snabba kalkyl, få ett preliminärt besked, och boka ett möte med en rådgivare. Hela processen tar mindre tid än du tror.',
    cta: 'Kom igång nu',
    hashtags: '#Nordea #Bolån #KomIgång',
    brandFitScore: 79,
    toneScores: { humanWarm: 68, clearSimple: 88, confidentHumble: 65, forwardLooking: 92 },
  },
];

const generateMockImprovement = (headline: string, body: string, cta: string): ImprovedCopy => ({
  headline: 'Ditt första boende börjar med en enkel kalkyl',
  body: 'Att köpa sin första bostad är stort. Vi hjälper dig förstå vad du har råd med – steg för steg, utan förpliktelser. På bara några minuter får du en tydlig bild av dina möjligheter.',
  cta: 'Se vad du har råd med',
  toneScores: { humanWarm: 85, clearSimple: 92, confidentHumble: 80, forwardLooking: 82 },
  suggestions: [
    {
      severity: 'high',
      field: 'Rubrik',
      original: headline || '(tom)',
      issue: 'För generisk och säljande ton',
      suggestion: 'Fokusera på kundens resa, inte på produkten',
    },
    {
      severity: 'medium',
      field: 'Brödtext',
      original: body || '(tom)',
      issue: '"Konkurrenskraftiga räntor" är bankjargong',
      suggestion: 'Berätta vad kunden får, inte vad ni erbjuder',
    },
    {
      severity: 'medium',
      field: 'CTA',
      original: cta || '(tom)',
      issue: '"Ansök nu" skapar onödig press',
      suggestion: 'Använd mjukare CTA som fokuserar på värde',
    },
  ],
});

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function ToneBar({ label, score, showWarning }: { label: string; score: number; showWarning?: string }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{score}%</span>
          {showWarning && (
            <span className="text-xs text-yellow-600">{showWarning}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-500">{label}</Label>
        <button onClick={handleCopy} className="text-gray-400 hover:text-[#0000A0]">
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <p className="text-sm bg-gray-50 rounded-lg p-3">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CopyStudioPage() {
  const supabase = createClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'improve' | 'test'>('create');

  // Create tab state
  const [channel, setChannel] = useState<ChannelKey>('linkedin');
  const [objective, setObjective] = useState<ObjectiveKey>('awareness');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<CopyVariant | null>(null);

  // Improve tab state
  const [improveChannel, setImproveChannel] = useState<ChannelKey>('linkedin');
  const [improveHeadline, setImproveHeadline] = useState('');
  const [improveBody, setImproveBody] = useState('');
  const [improveCta, setImproveCta] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [improvedCopy, setImprovedCopy] = useState<ImprovedCopy | null>(null);

  // Test tab state
  const [testCopy, setTestCopy] = useState<{ headline: string; body: string; cta: string } | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaReaction, setPersonaReaction] = useState<PersonaReaction | null>(null);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Fetch personas on mount
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const query = user
        ? supabase
            .from('personas')
            .select('id, name, avatar, age_min, age_max, traits, pain_points, system_prompt, response_style')
            .or(`user_id.eq.${user.id},is_default.eq.true`)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
        : supabase
            .from('personas')
            .select('id, name, avatar, age_min, age_max, traits, pain_points, system_prompt, response_style')
            .eq('is_default', true)
            .eq('is_active', true);

      const { data } = await query;

      if (data && data.length > 0) {
        setPersonas(data as Persona[]);
        setSelectedPersona(data[0] as Persona);
      }
    };
    fetchPersonas();
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // Handlers - Create tab
  // ---------------------------------------------------------------------------

  const handleGenerate = async () => {
    setIsGenerating(true);
    setVariants([]);
    setSelectedVariant(null);

    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          objective,
          topic,
          variants: 3,
        }),
      });
      const data = await res.json();

      if (data.variants && data.variants.length > 0) {
        setVariants(data.variants);
      } else {
        // Use single result as variant + add mock extras
        const mockVariants = generateMockVariants();
        if (data.headline) {
          mockVariants[0] = {
            ...mockVariants[0],
            headline: data.headline,
            subheadline: data.subheadline || mockVariants[0].subheadline,
            bodyCopy: data.bodyCopy || data.body_copy || mockVariants[0].bodyCopy,
            cta: data.cta || mockVariants[0].cta,
            brandFitScore: data.brandFitScore || data.brand_fit_score || mockVariants[0].brandFitScore,
          };
        }
        setVariants(mockVariants);
      }
    } catch {
      setVariants(generateMockVariants());
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariant = (variant: CopyVariant) => {
    setSelectedVariant(variant);
    setTestCopy({
      headline: variant.headline,
      body: variant.bodyCopy,
      cta: variant.cta,
    });
  };

  // ---------------------------------------------------------------------------
  // Handlers - Improve tab
  // ---------------------------------------------------------------------------

  const handleAnalyze = async () => {
    if (!improveHeadline.trim() && !improveBody.trim()) return;

    setIsAnalyzing(true);
    setImprovedCopy(null);

    // TODO: Replace with real API call when improve endpoint exists
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = generateMockImprovement(improveHeadline, improveBody, improveCta);
    setImprovedCopy(result);
    setIsAnalyzing(false);
  };

  const handleUseImproved = () => {
    if (!improvedCopy) return;
    setTestCopy({
      headline: improvedCopy.headline,
      body: improvedCopy.body,
      cta: improvedCopy.cta,
    });
    setActiveTab('test');
  };

  // ---------------------------------------------------------------------------
  // Handlers - Test tab
  // ---------------------------------------------------------------------------

  const handleTestWithPersona = async () => {
    if (!selectedPersona || !testCopy) return;

    setIsLoadingReaction(true);
    setPersonaReaction(null);
    setChatMessages([]);

    try {
      const response = await fetch('/api/persona-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedPersona.id,
          personaName: selectedPersona.name,
          personaTraits: selectedPersona.traits,
          personaPainPoints: selectedPersona.pain_points,
          personaSystemPrompt: selectedPersona.system_prompt,
          responseStyle: selectedPersona.response_style,
          copy: testCopy,
          channel,
        }),
      });

      const data = await response.json();
      setPersonaReaction(data);
    } catch (error) {
      console.error('Error getting persona reaction:', error);
    } finally {
      setIsLoadingReaction(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedPersona) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const message = chatInput;
    setChatInput('');

    try {
      const res = await fetch('/api/persona-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          messages: [...chatMessages, userMessage].map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          adContent: testCopy
            ? `Rubrik: ${testCopy.headline}\nBrödtext: ${testCopy.body}\nCTA: ${testCopy.cta}`
            : message,
        }),
      });
      const data = await res.json();

      const personaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'persona',
        content: data.reply || data.response || 'Jag kunde inte svara just nu.',
      };
      setChatMessages((prev) => [...prev, personaMessage]);
    } catch {
      const personaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'persona',
        content: 'Något gick fel. Försök igen.',
      };
      setChatMessages((prev) => [...prev, personaMessage]);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Copy Studio</h1>
        <p className="text-gray-500 mt-1">Skapa, förbättra och testa copy med Nordeas Tone of Voice</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="create">Skapa ny</TabsTrigger>
          <TabsTrigger value="improve">Förbättra</TabsTrigger>
          <TabsTrigger value="test">Testa med persona</TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* TAB: CREATE                                                       */}
        {/* ================================================================= */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Inställningar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kanal</Label>
                    <Select value={channel} onValueChange={(v) => setChannel(v as ChannelKey)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHANNELS).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label} (max {cfg.maxHeadline}/{cfg.maxBody} tecken)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kampanjmål</Label>
                    <Select value={objective} onValueChange={(v) => setObjective(v as ObjectiveKey)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OBJECTIVES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ämne & kontext</Label>
                    <Textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Beskriv produkt, kampanj eller budskap..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-[#0000A0] hover:bg-[#000080]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Genererar varianter...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generera 3 varianter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output */}
            <div className="space-y-4">
              {variants.length === 0 && !isGenerating && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Fyll i inställningar och klicka &quot;Generera&quot; för att skapa copy-varianter</p>
                  </CardContent>
                </Card>
              )}

              {isGenerating && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-10 h-10 mx-auto text-[#0000A0] animate-spin mb-3" />
                    <p className="text-gray-500">Genererar 3 varianter med Nordeas Tone of Voice...</p>
                  </CardContent>
                </Card>
              )}

              {variants.map((variant) => (
                <Card
                  key={variant.id}
                  className={`border-0 shadow-sm cursor-pointer transition-all ${
                    selectedVariant?.id === variant.id
                      ? 'ring-2 ring-[#0000A0]'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectVariant(variant)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{variant.angle}</Badge>
                      <Badge className={variant.brandFitScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        Brand Fit: {variant.brandFitScore}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{variant.headline}</h3>
                    <p className="text-sm text-gray-600 mb-2">{variant.subheadline}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{variant.bodyCopy}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[#0000A0] font-medium">{variant.cta}</span>
                      {selectedVariant?.id === variant.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('test');
                          }}
                        >
                          Testa med persona
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB: IMPROVE                                                      */}
        {/* ================================================================= */}
        <TabsContent value="improve" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Din nuvarande copy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kanal</Label>
                  <Select value={improveChannel} onValueChange={(v) => setImproveChannel(v as ChannelKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNELS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rubrik</Label>
                  <Input
                    value={improveHeadline}
                    onChange={(e) => setImproveHeadline(e.target.value)}
                    placeholder="Din nuvarande rubrik..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brödtext</Label>
                  <Textarea
                    value={improveBody}
                    onChange={(e) => setImproveBody(e.target.value)}
                    placeholder="Din nuvarande brödtext..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CTA</Label>
                  <Input
                    value={improveCta}
                    onChange={(e) => setImproveCta(e.target.value)}
                    placeholder="Din nuvarande CTA..."
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!improveHeadline.trim() && !improveBody.trim())}
                  className="w-full bg-[#0000A0] hover:bg-[#000080]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyserar...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Analysera & förbättra
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output */}
            <div className="space-y-4">
              {!improvedCopy && !isAnalyzing && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Wand2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Klistra in din befintliga copy för att få förbättringsförslag</p>
                  </CardContent>
                </Card>
              )}

              {isAnalyzing && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-10 h-10 mx-auto text-[#0000A0] animate-spin mb-3" />
                    <p className="text-gray-500">Analyserar din copy mot Nordeas Tone of Voice...</p>
                  </CardContent>
                </Card>
              )}

              {improvedCopy && (
                <>
                  {/* Tone analysis */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Tone of Voice-analys</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {TONE_LABELS.map(({ key, label }) => (
                        <ToneBar
                          key={key}
                          label={label}
                          score={improvedCopy.toneScores[key]}
                          showWarning={improvedCopy.toneScores[key] < 60 ? 'Behöver förbättras' : undefined}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Suggestions */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Förbättringsförslag</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {improvedCopy.suggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            suggestion.severity === 'high'
                              ? 'bg-red-50'
                              : suggestion.severity === 'medium'
                                ? 'bg-yellow-50'
                                : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-4 h-4 mt-0.5 ${
                              suggestion.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                            }`} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{suggestion.field}</p>
                              <p className="text-sm text-gray-600">{suggestion.issue}</p>
                              <p className="text-sm text-gray-500 mt-1">Förslag: {suggestion.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Improved version */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Förbättrad version
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CopyableField label="Rubrik" value={improvedCopy.headline} />
                      <CopyableField label="Brödtext" value={improvedCopy.body} />
                      <CopyableField label="CTA" value={improvedCopy.cta} />

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleUseImproved} className="flex-1 bg-[#0000A0] hover:bg-[#000080]">
                          Testa med persona
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            const text = `Rubrik: ${improvedCopy.headline}\nBrödtext: ${improvedCopy.body}\nCTA: ${improvedCopy.cta}`;
                            await navigator.clipboard.writeText(text);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Kopiera allt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB: TEST                                                         */}
        {/* ================================================================= */}
        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Copy to test */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Copy att testa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!testCopy ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">Ingen copy vald ännu</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setActiveTab('create')}>
                        Skapa ny
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('improve')}>
                        Förbättra befintlig
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Eller fyll i manuellt nedan:</p>
                    <div className="mt-4 space-y-3 text-left">
                      <div className="space-y-1">
                        <Label className="text-xs">Rubrik</Label>
                        <Input
                          placeholder="Skriv rubrik..."
                          onChange={(e) => setTestCopy({ headline: e.target.value, body: '', cta: '' })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Rubrik</Label>
                      <Input
                        value={testCopy.headline}
                        onChange={(e) => setTestCopy({ ...testCopy, headline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brödtext</Label>
                      <Textarea
                        value={testCopy.body}
                        onChange={(e) => setTestCopy({ ...testCopy, body: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA</Label>
                      <Input
                        value={testCopy.cta}
                        onChange={(e) => setTestCopy({ ...testCopy, cta: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Persona reaction */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Persona-reaktion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Välj persona</Label>
                  <Select
                    value={selectedPersona?.id}
                    onValueChange={(v) => {
                      const persona = personas.find((p) => p.id === v);
                      if (persona) {
                        setSelectedPersona(persona);
                        setPersonaReaction(null);
                        setChatMessages([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj persona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.avatar} {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPersona && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{selectedPersona.avatar}</span>
                      <div>
                        <p className="font-medium text-sm">{selectedPersona.name}</p>
                        <p className="text-xs text-gray-500">
                          {selectedPersona.age_min}-{selectedPersona.age_max} år
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedPersona.traits?.slice(0, 3).map((trait) => (
                        <Badge key={trait} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleTestWithPersona}
                  disabled={!testCopy || !selectedPersona || isLoadingReaction}
                  className="w-full bg-[#0000A0] hover:bg-[#000080]"
                >
                  {isLoadingReaction ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyserar reaktion...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Testa med {selectedPersona?.name || 'persona'}
                    </>
                  )}
                </Button>

                {personaReaction && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-gray-500">Första intryck</Label>
                      <p className="text-sm mt-1 italic text-gray-700">&quot;{personaReaction.firstImpression}&quot;</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-gray-500">Skulle klicka?</Label>
                      <Badge className={personaReaction.wouldClick >= 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {personaReaction.wouldClick >= 60 ? 'Troligt' : 'Osannolikt'} ({personaReaction.wouldClick}%)
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Invändningar</Label>
                      <ul className="mt-1 space-y-1">
                        {personaReaction.objections.map((obj, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">&#x2022;</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chat */}
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-gray-500 mb-2 block">Ställ en följdfråga</Label>

                      <ScrollArea className="h-[200px] mb-3">
                        <div className="space-y-2">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-[#0000A0] text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {msg.role === 'persona' && selectedPersona && (
                                  <span className="text-xs font-medium text-gray-500 block mb-0.5">
                                    {selectedPersona.avatar} {selectedPersona.name}
                                  </span>
                                )}
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                          placeholder={`Fråga ${selectedPersona?.name || 'personan'}...`}
                        />
                        <Button
                          size="icon"
                          className="bg-[#0000A0] hover:bg-[#000080] shrink-0"
                          onClick={handleSendChat}
                          disabled={!chatInput.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
