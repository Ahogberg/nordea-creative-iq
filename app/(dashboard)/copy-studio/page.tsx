'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChannelKey = 'meta' | 'tiktok' | 'display' | 'email';
type ObjectiveKey = 'awareness' | 'consideration' | 'conversion' | 'retention';

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
  issue: string;
  suggestion: string;
}

interface ImprovedCopy {
  headline: string;
  body: string;
  cta: string;
  toneScores: Record<string, number>;
  suggestions: ImprovementSuggestion[];
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  age_min: number | null;
  age_max: number | null;
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

const CHANNELS: Record<ChannelKey, { label: string; maxHeadline: number; maxBody: number }> = {
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
// Mock data
// ---------------------------------------------------------------------------

const generateMockVariants = (): CopyVariant[] => [
  {
    id: '1',
    angle: 'Emotionell',
    headline: 'Ditt första hem väntar på dig',
    subheadline: 'Vi hjälper dig hela vägen – från dröm till nyckel',
    bodyCopy: 'Att köpa sin första bostad är en av livets största milstolpar. Vi förstår att det kan kännas överväldigande. Därför finns vi här för att guida dig genom varje steg.',
    cta: 'Börja din resa',
    hashtags: '#Nordea #FörstaBostad #Bolån',
    brandFitScore: 87,
    toneScores: { humanWarm: 92, clearSimple: 85, confidentHumble: 78, forwardLooking: 88 },
  },
  {
    id: '2',
    angle: 'Rationell',
    headline: 'Räkna ut vad du har råd med på 2 minuter',
    subheadline: 'Vår bolånekalkyl ger dig svar direkt',
    bodyCopy: 'Kontantinsats, amortering, räntebindning – det finns mycket att hålla koll på. Vår kalkylator hjälper dig få en tydlig bild av din ekonomi.',
    cta: 'Testa kalkylatorn',
    hashtags: '#Nordea #Bolånekalkyl',
    brandFitScore: 82,
    toneScores: { humanWarm: 72, clearSimple: 94, confidentHumble: 85, forwardLooking: 78 },
  },
  {
    id: '3',
    angle: 'Handlingsfokuserad',
    headline: 'Starta din bostadsresa idag',
    subheadline: 'Tre enkla steg till ditt bolånebesked',
    bodyCopy: 'Sluta fundera, börja agera. Fyll i vår snabba kalkyl, få ett preliminärt besked, och boka ett möte med en rådgivare.',
    cta: 'Kom igång nu',
    hashtags: '#Nordea #Bolån',
    brandFitScore: 79,
    toneScores: { humanWarm: 68, clearSimple: 88, confidentHumble: 65, forwardLooking: 92 },
  },
];

const generateMockImprovement = (): ImprovedCopy => ({
  headline: 'Ditt första boende börjar med en enkel kalkyl',
  body: 'Att köpa sin första bostad är stort. Vi hjälper dig förstå vad du har råd med – steg för steg, utan förpliktelser.',
  cta: 'Se vad du har råd med',
  toneScores: { humanWarm: 85, clearSimple: 92, confidentHumble: 80, forwardLooking: 82 },
  suggestions: [
    { severity: 'high', field: 'Rubrik', issue: 'För generisk och säljande ton', suggestion: 'Fokusera på kundens resa' },
    { severity: 'medium', field: 'Brödtext', issue: 'Bankjargong', suggestion: 'Berätta vad kunden får' },
    { severity: 'medium', field: 'CTA', issue: '"Ansök nu" skapar press', suggestion: 'Mjukare CTA' },
  ],
});

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function ToneBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
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
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'create' | 'improve' | 'test'>('create');

  // Create tab
  const [channel, setChannel] = useState<ChannelKey>('meta');
  const [objective, setObjective] = useState<ObjectiveKey>('awareness');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<CopyVariant | null>(null);

  // Improve tab
  const [improveHeadline, setImproveHeadline] = useState('');
  const [improveBody, setImproveBody] = useState('');
  const [improveCta, setImproveCta] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [improvedCopy, setImprovedCopy] = useState<ImprovedCopy | null>(null);

  // Test tab
  const [testCopy, setTestCopy] = useState<{ headline: string; body: string; cta: string } | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaReaction, setPersonaReaction] = useState<PersonaReaction | null>(null);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Fetch personas
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase
        .from('personas')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      if (data) {
        setPersonas(data);
        if (data.length > 0) setSelectedPersona(data[0]);
      }
    };
    fetchPersonas();
  }, [supabase]);

  // Handlers
  const handleGenerate = async () => {
    setIsGenerating(true);
    setVariants([]);
    setSelectedVariant(null);

    try {
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, objective, topic }),
      });

      if (!response.ok) throw new Error('Failed to generate');
      const data = await response.json();
      setVariants(data.variants || []);
    } catch (error) {
      console.error('Error generating copy:', error);
      setVariants(generateMockVariants());
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariant = (variant: CopyVariant) => {
    setSelectedVariant(variant);
    setTestCopy({ headline: variant.headline, body: variant.bodyCopy, cta: variant.cta });
  };

  const handleAnalyze = async () => {
    if (!improveHeadline.trim() && !improveBody.trim()) return;
    setIsAnalyzing(true);
    setImprovedCopy(null);

    try {
      const response = await fetch('/api/improve-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          headline: improveHeadline,
          body: improveBody,
          cta: improveCta,
        }),
      });

      if (!response.ok) throw new Error('Failed to improve');
      const data = await response.json();
      setImprovedCopy({
        headline: data.improved?.headline || improveHeadline,
        body: data.improved?.body || improveBody,
        cta: data.improved?.cta || improveCta,
        toneScores: data.analysis?.toneScores || {},
        suggestions: data.suggestions || [],
      });
    } catch (error) {
      console.error('Error improving copy:', error);
      setImprovedCopy(generateMockImprovement());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseImproved = () => {
    if (!improvedCopy) return;
    setTestCopy({ headline: improvedCopy.headline, body: improvedCopy.body, cta: improvedCopy.cta });
    setActiveTab('test');
  };

  const handleTestWithPersona = async () => {
    if (!selectedPersona || !testCopy) return;
    setIsLoadingReaction(true);
    setChatMessages([]);

    try {
      const res = await fetch('/api/persona-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          personaTraits: selectedPersona.traits,
          personaPainPoints: selectedPersona.pain_points,
          personaSystemPrompt: selectedPersona.system_prompt,
          responseStyle: selectedPersona.response_style,
          copy: testCopy,
          channel,
        }),
      });
      const data = await res.json();
      setPersonaReaction(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingReaction(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedPersona) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const msg = chatInput;
    setChatInput('');

    try {
      const res = await fetch('/api/persona-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          messages: [...chatMessages, userMsg].map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          adContent: testCopy
            ? `Rubrik: ${testCopy.headline}\nBrödtext: ${testCopy.body}\nCTA: ${testCopy.cta}`
            : msg,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'persona', content: data.reply || 'Kunde inte svara.' },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'persona', content: 'Något gick fel.' },
      ]);
    }
  };

  const handleGoToAdStudio = () => {
    const copy = testCopy || (selectedVariant ? { headline: selectedVariant.headline, body: selectedVariant.bodyCopy, cta: selectedVariant.cta } : improvedCopy ? { headline: improvedCopy.headline, body: improvedCopy.body, cta: improvedCopy.cta } : null);
    if (copy) {
      sessionStorage.setItem('copyForAdStudio', JSON.stringify({ ...copy, channel }));
    }
    router.push('/ad-studio');
  };

  // Persona selector with "+ Skapa ny persona"
  const PersonaSelector = ({ value, onChange }: { value: Persona | null; onChange: (p: Persona) => void }) => (
    <Select
      value={value?.id || ''}
      onValueChange={(v) => {
        if (v === 'create-new') {
          router.push('/personas');
        } else {
          const p = personas.find((px) => px.id === v);
          if (p) onChange(p);
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Välj persona..." />
      </SelectTrigger>
      <SelectContent>
        {personas.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.avatar} {p.name}
          </SelectItem>
        ))}
        <SelectItem value="create-new" className="text-[#0000A0]">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Skapa ny persona
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );

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
          <TabsTrigger value="test">Testa</TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* CREATE TAB                                                        */}
        {/* ================================================================= */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Inställningar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kanal</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as ChannelKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNELS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kampanjmål</Label>
                  <Select value={objective} onValueChange={(v) => setObjective(v as ObjectiveKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-[#0000A0] hover:bg-[#000080]">
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Genererar...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generera 3 varianter</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {variants.length === 0 && !isGenerating && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Fyll i inställningar och klicka &quot;Generera&quot;</p>
                  </CardContent>
                </Card>
              )}
              {isGenerating && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-10 h-10 mx-auto text-[#0000A0] animate-spin mb-3" />
                    <p className="text-gray-500">Genererar 3 varianter...</p>
                  </CardContent>
                </Card>
              )}
              {variants.map((variant) => (
                <Card
                  key={variant.id}
                  className={`border-0 shadow-sm cursor-pointer transition-all ${selectedVariant?.id === variant.id ? 'ring-2 ring-[#0000A0]' : 'hover:shadow-md'}`}
                  onClick={() => handleSelectVariant(variant)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{variant.angle}</Badge>
                      <Badge className={variant.brandFitScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        Brand Fit: {variant.brandFitScore}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{variant.headline}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{variant.bodyCopy}</p>
                    <div className="mt-2 text-xs text-[#0000A0] font-medium">{variant.cta}</div>
                    {selectedVariant?.id === variant.id && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveTab('test'); }}>
                          Testa med persona <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGoToAdStudio(); }}>
                          <ImageIcon className="w-3 h-3 mr-1" /> Testa med kreativ
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* IMPROVE TAB                                                       */}
        {/* ================================================================= */}
        <TabsContent value="improve" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Din nuvarande copy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kanal</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as ChannelKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNELS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rubrik</Label>
                  <Input value={improveHeadline} onChange={(e) => setImproveHeadline(e.target.value)} placeholder="Din nuvarande rubrik..." />
                </div>
                <div className="space-y-2">
                  <Label>Brödtext</Label>
                  <Textarea value={improveBody} onChange={(e) => setImproveBody(e.target.value)} placeholder="Din nuvarande brödtext..." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>CTA</Label>
                  <Input value={improveCta} onChange={(e) => setImproveCta(e.target.value)} placeholder="Din nuvarande CTA..." />
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || (!improveHeadline && !improveBody)} className="w-full bg-[#0000A0] hover:bg-[#000080]">
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyserar...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Analysera & förbättra</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {!improvedCopy && !isAnalyzing && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Wand2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Klistra in din copy för att få förbättringsförslag</p>
                  </CardContent>
                </Card>
              )}
              {isAnalyzing && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-10 h-10 mx-auto text-[#0000A0] animate-spin mb-3" />
                    <p className="text-gray-500">Analyserar mot Nordeas Tone of Voice...</p>
                  </CardContent>
                </Card>
              )}
              {improvedCopy && (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader><CardTitle className="text-base">Tone of Voice-analys</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {TONE_LABELS.map(({ key, label }) => (
                        <ToneBar key={key} label={label} score={improvedCopy.toneScores[key] || 0} />
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardHeader><CardTitle className="text-base">Förbättringsförslag</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {improvedCopy.suggestions.map((s, i) => (
                        <div key={i} className={`p-3 rounded-lg ${s.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-4 h-4 mt-0.5 ${s.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <div>
                              <p className="text-sm font-medium">{s.field}: {s.issue}</p>
                              <p className="text-sm text-gray-500 mt-0.5">Förslag: {s.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
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
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleUseImproved} className="flex-1 bg-[#0000A0] hover:bg-[#000080]">
                          Testa med persona <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button onClick={handleGoToAdStudio} variant="outline" className="flex-1">
                          <ImageIcon className="w-4 h-4 mr-2" /> Testa med kreativ
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
        {/* TEST TAB                                                          */}
        {/* ================================================================= */}
        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Copy att testa</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!testCopy ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">Ingen copy vald</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setActiveTab('create')}>Skapa ny</Button>
                      <Button variant="outline" onClick={() => setActiveTab('improve')}>Förbättra</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Rubrik</Label>
                      <Input value={testCopy.headline} onChange={(e) => setTestCopy({ ...testCopy, headline: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Brödtext</Label>
                      <Textarea value={testCopy.body} onChange={(e) => setTestCopy({ ...testCopy, body: e.target.value })} rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA</Label>
                      <Input value={testCopy.cta} onChange={(e) => setTestCopy({ ...testCopy, cta: e.target.value })} />
                    </div>
                    <Button onClick={handleGoToAdStudio} variant="outline" className="w-full">
                      <ImageIcon className="w-4 h-4 mr-2" /> Testa med kreativ i Ad Studio
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

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
                  <PersonaSelector value={selectedPersona} onChange={(p) => { setSelectedPersona(p); setPersonaReaction(null); setChatMessages([]); }} />
                </div>

                {selectedPersona && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedPersona.avatar}</span>
                      <div>
                        <p className="font-medium text-sm">{selectedPersona.name}</p>
                        <p className="text-xs text-gray-500">{selectedPersona.age_min}–{selectedPersona.age_max} år</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleTestWithPersona} disabled={!testCopy || !selectedPersona || isLoadingReaction} className="w-full bg-[#0000A0] hover:bg-[#000080]">
                  {isLoadingReaction ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyserar...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Testa</>
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
                        {personaReaction.wouldClick}%
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Invändningar</Label>
                      <ul className="mt-1 space-y-1">
                        {personaReaction.objections.map((obj, i) => (
                          <li key={i} className="text-sm text-gray-600">&#x2022; {obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="text-xs text-gray-500 mb-2 block">Ställ en följdfråga</Label>
                      <ScrollArea className="h-[150px] mb-3">
                        <div className="space-y-2">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#0000A0] text-white' : 'bg-gray-100'}`}>
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
                        <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Fråga..." />
                        <Button size="icon" className="bg-[#0000A0] hover:bg-[#000080] shrink-0" onClick={handleSendChat} disabled={!chatInput.trim()}>
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
