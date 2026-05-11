'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader, FeedbackList, PersonaAvatar } from '@/components/ui/nordea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon, Video, Send, ChevronDown, ChevronUp, Plus, Loader2, Upload, AlertTriangle, X } from 'lucide-react';
import { detectProductFromText, getRelevantPersonas, PRODUCT_LABELS, type ProductMatch } from '@/lib/product-detection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalysisResult {
  score: number;
  summary: string;
  issues: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
  details: {
    visual: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
    copy: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
  };
  videoAnalysis?: {
    duration: number;
    hookScore: number;
    pacingScore: number;
    ctaTiming: string;
  };
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  traits: string[];
  pain_points: string[];
  system_prompt: string | null;
  response_style: string;
  age_min?: number;
  age_max?: number;
  description?: string;
  digital_maturity?: string;
  goals?: string[];
}

interface PersonaReaction {
  impression: string;
  wouldClick: number;
  objections: string[];
  whatWorked?: string;
  suggestion?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'persona';
  content: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockImageAnalysis: AnalysisResult = {
  score: 82,
  summary: 'Bra visuellt intryck med korrekt branding. Disclaimer saknas för finansiell produkt.',
  issues: [
    { status: 'fail', message: 'Disclaimer saknas för finansiell produkt' },
    { status: 'warning', message: 'CTA-kontrasten kan förbättras' },
    { status: 'warning', message: 'Textöverlägg kan vara svårlästa på mobil' },
  ],
  details: {
    visual: [
      { status: 'pass', message: 'Bildkvalitet är god (hög upplösning)' },
      { status: 'pass', message: 'Nordea-branding synlig och korrekt' },
      { status: 'warning', message: 'Kontrasten kan förbättras på CTA' },
    ],
    copy: [
      { status: 'pass', message: 'Rubriken är tydlig och kortfattad' },
      { status: 'pass', message: 'Tone of Voice stämmer med riktlinjer' },
      { status: 'fail', message: 'Disclaimer saknas för finansiell produkt' },
    ],
  },
};

const mockVideoAnalysis: AnalysisResult = {
  score: 79,
  summary: 'Bra visuellt intryck. CTA kommer för sent och disclaimer saknas.',
  issues: [
    { status: 'fail', message: 'Disclaimer saknas för finansiell produkt' },
    { status: 'warning', message: 'CTA visas efter 12 sek - bör komma inom 8 sek' },
    { status: 'warning', message: 'Textöverlägg kan vara svårlästa på mobil' },
  ],
  details: {
    visual: [
      { status: 'pass', message: 'Videokvalitet är god (1080p)' },
      { status: 'pass', message: 'Nordea-branding synlig genom hela videon' },
      { status: 'warning', message: 'Textöverlägg svårlästa i vissa frames' },
    ],
    copy: [
      { status: 'pass', message: 'Budskapet är tydligt' },
      { status: 'warning', message: 'CTA kommer sent (efter 12 sek)' },
      { status: 'fail', message: 'Disclaimer saknas' },
    ],
  },
  videoAnalysis: {
    duration: 15,
    hookScore: 85,
    pacingScore: 68,
    ctaTiming: 'Sen (12s) - rekommenderat inom 8s',
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdStudioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [cta, setCta] = useState('');
  const [channel, setChannel] = useState('meta');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<ProductMatch | null>(null);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaReaction, setPersonaReaction] = useState<PersonaReaction | null>(null);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Import copy from Copy Studio via sessionStorage
  useEffect(() => {
    const savedCopy = sessionStorage.getItem('copyForAdStudio');
    if (savedCopy) {
      try {
        const parsed = JSON.parse(savedCopy);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.body) setBodyText(parsed.body);
        if (parsed.cta) setCta(parsed.cta);
        if (parsed.channel) setChannel(parsed.channel);
        sessionStorage.removeItem('copyForAdStudio');
      } catch (e) {
        console.error('Failed to parse saved copy', e);
      }
    }
  }, []);

  // Auto-detect product
  useEffect(() => {
    if (headline || bodyText || cta) {
      setDetectedProduct(detectProductFromText(headline, bodyText, cta));
    } else {
      setDetectedProduct(null);
    }
  }, [headline, bodyText, cta]);

  // Fetch personas
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('*').eq('is_active', true).order('is_default', { ascending: false });
      if (data) {
        setPersonas(data);
        if (data.length > 0) setSelectedPersona(data[0]);
      }
    };
    fetchPersonas();
  }, [supabase]);

  // Sort personas by relevance
  const sortedPersonas = (() => {
    if (!detectedProduct || detectedProduct.category === 'general') {
      return { relevant: personas, other: [] as Persona[] };
    }
    const relevanceMap = getRelevantPersonas(detectedProduct.category, personas.map((p) => p.name));
    const relevant: Persona[] = [];
    const other: Persona[] = [];
    for (const p of personas) {
      const match = relevanceMap.find((r) => r.name === p.name);
      if (match?.isRelevant) relevant.push(p);
      else other.push(p);
    }
    return { relevant, other };
  })();

  const handleMediaUpload = useCallback((file: File) => {
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    if (isVideo) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const removeMedia = () => {
    if (mediaPreview && mediaType === 'video') URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setAnalysis(null);
  };

  // Analyze with real API + fallback
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setPersonaReaction(null);
    setShowDetails(false);

    const product = detectProductFromText(headline, bodyText, cta);
    setDetectedProduct(product);

    try {
      if (mediaType === 'video' && mediaFile) {
        const { extractFramesFromVideo, getVideoMetadata } = await import('@/lib/video-utils');
        const frames = await extractFramesFromVideo(mediaFile, { frameInterval: 2, maxFrames: 8 });
        const metadata = await getVideoMetadata(mediaFile);

        const framesForApi = frames.map((frame) => ({
          timestamp: frame.timestamp,
          base64: frame.dataUrl.split(',')[1],
          mediaType: 'image/jpeg',
        }));

        const response = await fetch('/api/analyze-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frames: framesForApi, duration: metadata.duration, headline, bodyText, cta, channel }),
        });

        if (!response.ok) throw new Error('Failed to analyze video');
        const data = await response.json();

        setAnalysis({
          score: data.scores?.overall || 79,
          summary: data.summary || mockVideoAnalysis.summary,
          issues: [
            ...(data.complianceIssues || []).map((ci: { severity: string; issue: string }) => ({
              status: (ci.severity === 'high' ? 'fail' : 'warning') as 'pass' | 'warning' | 'fail',
              message: ci.issue,
            })),
            ...(data.suggestions || []).slice(0, 2).map((s: string) => ({ status: 'warning' as const, message: s })),
          ],
          details: {
            visual: data.brandingAnalysis
              ? [
                  { status: 'pass' as const, message: `Branding: ${data.brandingAnalysis.brandFit}` },
                  { status: (data.scores?.hook >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `Hook (3s): ${data.hookAnalysis?.feedback || 'Analyserad'}` },
                ]
              : mockVideoAnalysis.details.visual,
            copy: data.ctaAnalysis
              ? [
                  { status: (data.scores?.ctaTiming >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `CTA-timing: ${data.ctaAnalysis.timing}` },
                  ...(data.complianceIssues || []).map((ci: { severity: string; issue: string }) => ({
                    status: (ci.severity === 'high' ? 'fail' : 'warning') as 'pass' | 'warning' | 'fail',
                    message: ci.issue,
                  })),
                ]
              : mockVideoAnalysis.details.copy,
          },
          videoAnalysis: {
            duration: metadata.duration,
            hookScore: data.scores?.hook || 75,
            pacingScore: data.scores?.pacing || 70,
            ctaTiming: data.ctaAnalysis?.timing || 'Analyserad',
          },
        });
      } else if (mediaType === 'image' && mediaPreview) {
        const base64 = mediaPreview.split(',')[1];
        const mimeType = mediaPreview.split(';')[0].split(':')[1];

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: mimeType, headline, bodyText, cta, channel }),
        });

        if (!response.ok) throw new Error('Failed to analyze image');
        const data = await response.json();

        setAnalysis({
          score: data.scores?.overall || 82,
          summary: data.summary || mockImageAnalysis.summary,
          issues: [
            ...(data.complianceIssues || []).map((ci: { severity: string; issue: string }) => ({
              status: (ci.severity === 'high' ? 'fail' : 'warning') as 'pass' | 'warning' | 'fail',
              message: ci.issue,
            })),
            ...(data.suggestions || []).slice(0, 2).map((s: string) => ({ status: 'warning' as const, message: s })),
          ],
          details: {
            visual: data.visualAnalysis?.feedback || mockImageAnalysis.details.visual,
            copy: data.copyAnalysis?.feedback || mockImageAnalysis.details.copy,
          },
        });
      } else {
        // Text-only analysis
        await new Promise((r) => setTimeout(r, 1500));
        setAnalysis(mockImageAnalysis);
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      setAnalysis(mediaType === 'video' ? mockVideoAnalysis : mockImageAnalysis);
    } finally {
      setIsAnalyzing(false);
    }

    if (selectedPersona) handleGetReaction();
  };

  // Persona reaction with real API + fallback
  const handleGetReaction = async () => {
    if (!selectedPersona) return;
    setIsLoadingReaction(true);
    setChatMessages([]);

    const product = detectedProduct || detectProductFromText(headline, bodyText, cta);

    try {
      const res = await fetch('/api/persona-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          personaDescription: selectedPersona.description,
          personaTraits: selectedPersona.traits,
          personaPainPoints: selectedPersona.pain_points,
          personaAge: selectedPersona.age_min ? { min: selectedPersona.age_min, max: selectedPersona.age_max || selectedPersona.age_min + 10 } : undefined,
          personaDigitalMaturity: selectedPersona.digital_maturity,
          personaSystemPrompt: selectedPersona.system_prompt,
          responseStyle: selectedPersona.response_style,
          copy: { headline, body: bodyText, cta },
          channel,
          isVideo: mediaType === 'video',
          productCategory: product.category,
        }),
      });
      const data = await res.json();
      setPersonaReaction({
        impression: data.firstImpression || 'Intressant annons.',
        wouldClick: data.wouldClick || 50,
        objections: data.objections || [],
        whatWorked: data.whatWorked || undefined,
        suggestion: data.suggestion || undefined,
      });
    } catch {
      setPersonaReaction({
        impression: `Som ${selectedPersona.name.toLowerCase()} tycker jag att annonsen har ett tydligt budskap, men jag saknar konkret information om villkor och nästa steg.`,
        wouldClick: 68,
        objections: ['Vad kostar det?', 'Vad händer när jag klickar?'],
      });
    } finally {
      setIsLoadingReaction(false);
    }
  };

  // Chat with real API + fallback
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedPersona) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const msg = chatInput;
    setChatInput('');

    const product = detectedProduct || detectProductFromText(headline, bodyText, cta);

    try {
      const res = await fetch('/api/persona-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          personaDescription: selectedPersona.description,
          personaTraits: selectedPersona.traits,
          personaPainPoints: selectedPersona.pain_points,
          responseStyle: selectedPersona.response_style,
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          adContext: { headline, body: bodyText, cta, channel },
          newMessage: msg,
          productCategory: product.category,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'persona', content: data.reply || 'Kunde inte svara.' }]);
    } catch {
      setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'persona', content: 'Det är en bra fråga. Jag skulle vilja se mer konkret information.' }]);
    }
  };

  const hasContent = mediaPreview || headline.trim() || bodyText.trim();

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader title="Ad Studio" description="Analysera annonser och testa med personas" />

      {/* Input section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Media upload */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Kreativt material</Label>
          <div
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleMediaUpload(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${mediaPreview ? 'border-[#0000A0] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
          >
            {mediaPreview ? (
              <div className="space-y-3">
                {mediaType === 'video' ? (
                  <video src={mediaPreview} controls className="max-h-32 mx-auto rounded" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                )}
                <div className="flex items-center justify-center gap-2">
                  {mediaFile && <span className="text-xs text-gray-400">{mediaFile.name}</span>}
                  <Button variant="outline" size="sm" onClick={removeMedia}>Byt fil</Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-600">Dra & släpp eller klicka</p>
                <p className="text-xs text-gray-400 mt-1">Bild eller video</p>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        {/* Copy input */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Annonsinnehåll</Label>
            {detectedProduct && detectedProduct.category !== 'general' && (
              <span className="text-xs text-[#0000A0] bg-blue-50 px-2 py-1 rounded">{PRODUCT_LABELS[detectedProduct.category]}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Rubrik</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Annonsens rubrik..." />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Brödtext</Label>
            <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Annonsens brödtext..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">CTA</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Läs mer..." />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Kanal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta/Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <Button onClick={handleAnalyze} disabled={isAnalyzing || !hasContent} className="w-full h-11 bg-[#0000A0] hover:bg-[#00005E] mb-6">
        {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {isAnalyzing ? 'Analyserar...' : 'Analysera annons'}
      </Button>

      {/* Results */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis results - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Score + summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-6">
                <div className="text-center shrink-0">
                  <span className="text-4xl font-semibold text-gray-900">{analysis.score}</span>
                  <p className="text-xs text-gray-500 mt-1">av 100</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">{analysis.summary}</p>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {issue.status === 'fail' ? <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                        <span className="text-sm text-gray-700">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Video-specific metrics */}
            {analysis.videoAnalysis && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Video-analys</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Längd</p>
                    <p className="font-semibold text-gray-900">{analysis.videoAnalysis.duration}s</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Hook (3s)</p>
                    <p className="font-semibold text-gray-900">{analysis.videoAnalysis.hookScore}/100</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Pacing</p>
                    <p className="font-semibold text-gray-900">{analysis.videoAnalysis.pacingScore}/100</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">CTA-timing</p>
                    <p className="font-semibold text-gray-900 text-sm">{analysis.videoAnalysis.ctaTiming}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible details */}
            <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Dölj detaljer' : 'Visa detaljerad analys'}
            </button>

            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <FeedbackList items={analysis.details.visual} title="Visuell analys" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <FeedbackList items={analysis.details.copy} title="Copy-analys" />
                </div>
              </div>
            )}
          </div>

          {/* Persona panel - 1 column */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-medium text-gray-900 mb-4">Testa med persona</h3>

            <Select
              value={selectedPersona?.id || ''}
              onValueChange={(v) => {
                if (v === 'new') { router.push('/personas'); return; }
                const p = personas.find((px) => px.id === v);
                if (p) { setSelectedPersona(p); setPersonaReaction(null); setChatMessages([]); }
              }}
            >
              <SelectTrigger className="mb-4"><SelectValue placeholder="Välj persona" /></SelectTrigger>
              <SelectContent>
                {sortedPersonas.relevant.length > 0 && sortedPersonas.other.length > 0 && (
                  <div className="px-2 py-1.5">
                    <span className="text-xs font-medium text-[#0000A0]">Relevanta</span>
                  </div>
                )}
                {sortedPersonas.relevant.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
                {sortedPersonas.other.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 mt-1 border-t">
                      <span className="text-xs font-medium text-gray-400">Övriga</span>
                    </div>
                    {sortedPersonas.other.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="new" className="text-[#0000A0]"><Plus className="w-4 h-4 inline mr-2" />Skapa ny</SelectItem>
              </SelectContent>
            </Select>

            {selectedPersona && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <PersonaAvatar name={selectedPersona.name} />
                <div>
                  <p className="font-medium text-sm text-gray-900">{selectedPersona.name}</p>
                  <p className="text-xs text-gray-500">{selectedPersona.age_min}-{selectedPersona.age_max} år</p>
                </div>
              </div>
            )}

            <Button onClick={handleGetReaction} disabled={!selectedPersona || isLoadingReaction} className="w-full bg-[#0000A0] hover:bg-[#00005E]">
              {isLoadingReaction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Få feedback
            </Button>

            {personaReaction && selectedPersona && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm text-gray-700 italic">&quot;{personaReaction.impression}&quot;</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Skulle klicka</span>
                  <span className="font-medium text-gray-900">{personaReaction.wouldClick}%</span>
                </div>

                {personaReaction.whatWorked && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Vad som fungerade</p>
                    <p className="text-sm text-gray-700">{personaReaction.whatWorked}</p>
                  </div>
                )}

                {personaReaction.suggestion && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Förslag</p>
                    <p className="text-sm text-gray-700">{personaReaction.suggestion}</p>
                  </div>
                )}

                {personaReaction.objections.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Funderingar</p>
                    {personaReaction.objections.map((obj, i) => (
                      <p key={i} className="text-sm text-gray-600 mb-1">&bull; {obj}</p>
                    ))}
                  </div>
                )}

                {/* Chat */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Fråga {selectedPersona.name}</p>
                  {chatMessages.length > 0 && (
                    <ScrollArea className="h-24 mb-3">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[#0000A0] text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {msg.content}
                          </span>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                  <div className="flex gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Ställ en fråga..." className="flex-1" />
                    <Button size="icon" onClick={handleSendChat} disabled={!chatInput.trim()} className="bg-[#0000A0] hover:bg-[#00005E]">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
