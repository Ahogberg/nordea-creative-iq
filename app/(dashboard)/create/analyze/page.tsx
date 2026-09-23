'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FeedbackList } from '@/components/ui/nordea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon, Send, ChevronDown, ChevronUp, Plus, Loader2, Upload, AlertTriangle, X, Sparkles, LayoutList, Smartphone, MessageCircle, Quote, Eye, ScanEye } from 'lucide-react';
import { detectProductFromText, getRelevantPersonas, PRODUCT_LABELS, type ProductMatch } from '@/lib/product-detection';
import { downscaleDataUrl } from '@/lib/image-utils';
import { findPersona } from '@/lib/persona-library';
import { defaultPersonas } from '@/lib/constants/personas';
import { Topbar } from '@/components/layout/topbar';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionTitle } from '@/components/layout/section-title';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { NordeaBadge } from '@/components/ui/nordea-badge';
import { FormatChip } from '@/components/ui/format-chip';
import { PersonaImage } from '@/components/ui/persona-image';
import { ScoreRing } from '@/components/ui/score-ring';
import { FeedMockup } from '@/components/preview/feed-mockup';
import { AttentionOverlay } from '@/components/preview/attention-overlay';
import { FocusGroupPanel, type FocusGroupContext } from '@/components/focus-group/focus-group-panel';
import type { AttentionResult } from '@/app/api/attention/route';

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
  firstNoticed?: string;
  sawVisual?: boolean;
  /** Exempelsvar (ingen AI-nyckel) — inte en riktig simulering. */
  mock?: boolean;
  /** Personan kunde inte svara — visas som fel, inte som en siffra. */
  error?: string;
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

type Placement = 'story' | 'feed' | 'raw' | 'attention';

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
  const [placement, setPlacement] = useState<Placement>('feed');
  const [attention, setAttention] = useState<AttentionResult | null>(null);
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [focusGroupSignal, setFocusGroupSignal] = useState(0);
  // Bild/bildrutor som personas får se. Byggs en gång per uppladdning.
  const personaImagesRef = useRef<{ source: string; images: string[] } | null>(null);

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
      // Utan databas (demo/lokalt) används persona-biblioteket direkt.
      const list: Persona[] =
        data && data.length > 0
          ? data
          : defaultPersonas.map((p) => ({ ...p, id: findPersona(p.name)?.id ?? p.name }));
      setPersonas(list);
      if (list.length > 0) setSelectedPersona(list[0]);
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
    setAttention(null);
    setPlacement((p) => (p === 'attention' ? 'feed' : p));
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
    setAttention(null);
    setPlacement((p) => (p === 'attention' ? 'feed' : p));
  };

  // Nedskalad bild (eller 4 bildrutor ur videon) som skickas med till personas.
  const getPersonaImages = async (): Promise<string[]> => {
    if (!mediaPreview) return [];
    if (personaImagesRef.current?.source === mediaPreview) return personaImagesRef.current.images;
    try {
      let images: string[] = [];
      if (mediaType === 'video' && mediaFile) {
        const { extractFramesFromVideo, getVideoMetadata } = await import('@/lib/video-utils');
        const { duration } = await getVideoMetadata(mediaFile);
        // 3 jämnt fördelade rutor + slutrutan (där CTA:n brukar ligga).
        const frames = await extractFramesFromVideo(mediaFile, { frameInterval: Math.max(0.5, duration / 3), maxFrames: 3 });
        images = await Promise.all(frames.slice(0, 4).map((f) => downscaleDataUrl(f.dataUrl)));
      } else if (mediaType === 'image') {
        images = [await downscaleDataUrl(mediaPreview)];
      }
      personaImagesRef.current = { source: mediaPreview, images };
      return images;
    } catch (error) {
      console.error('Kunde inte förbereda bild för personas:', error);
      return [];
    }
  };

  const loadAttention = async () => {
    if (mediaType !== 'image' || attentionLoading) return;
    setAttentionLoading(true);
    try {
      const [image] = await getPersonaImages();
      if (!image) return;
      const res = await fetch('/api/attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, headline, cta }),
      });
      if (res.ok) setAttention(await res.json());
    } catch (error) {
      console.error('Uppmärksamhetsanalys misslyckades:', error);
    } finally {
      setAttentionLoading(false);
    }
  };

  const changePlacement = (p: Placement) => {
    setPlacement(p);
    if (p === 'attention' && !attention) void loadAttention();
  };

  const getFocusGroupContext = async (): Promise<FocusGroupContext> => ({
    copy: { headline, body: bodyText, cta },
    channel,
    images: await getPersonaImages(),
    isVideo: mediaType === 'video',
    productCategory: (detectedProduct || detectProductFromText(headline, bodyText, cta)).category,
  });

  // Analyze with real API + fallback
  const handleAnalyze = async () => {
    setFocusGroupSignal((n) => n + 1);
    if (mediaType === 'image' && !attention) void loadAttention();
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
    const images = await getPersonaImages();

    try {
      const res = await fetch('/api/persona-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: selectedPersona.name,
          personaDescription: selectedPersona.description,
          personaTraits: selectedPersona.traits,
          personaPainPoints: selectedPersona.pain_points,
          personaGoals: selectedPersona.goals,
          personaAge: selectedPersona.age_min ? { min: selectedPersona.age_min, max: selectedPersona.age_max || selectedPersona.age_min + 10 } : undefined,
          personaDigitalMaturity: selectedPersona.digital_maturity,
          personaSystemPrompt: selectedPersona.system_prompt,
          responseStyle: selectedPersona.response_style,
          copy: { headline, body: bodyText, cta },
          channel,
          images,
          isVideo: mediaType === 'video',
          productCategory: product.category,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Personan kunde inte svara');
      setPersonaReaction({
        impression: data.firstImpression || '',
        wouldClick: data.wouldClick,
        objections: data.objections || [],
        whatWorked: data.whatWorked || undefined,
        suggestion: data.suggestion || undefined,
        firstNoticed: data.firstNoticed || undefined,
        sawVisual: data.sawVisual === true,
        mock: data.simulation === 'mock',
      });
    } catch (err) {
      // Inget påhittat svar vid fel — visa felet.
      setPersonaReaction({
        impression: '',
        wouldClick: 0,
        objections: [],
        error: err instanceof Error ? err.message : 'Personan kunde inte svara',
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
    const images = await getPersonaImages();

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
          // Historiken utan det nya meddelandet — det skickas som newMessage.
          messages: chatMessages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          adContext: { headline, body: bodyText, cta, channel },
          newMessage: msg,
          images,
          isVideo: mediaType === 'video',
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
  const selectedProfile = selectedPersona ? findPersona(selectedPersona.name) : undefined;

  const mediaNode = mediaPreview ? (
    mediaType === 'video' ? (
      <video src={mediaPreview} autoPlay muted loop playsInline className="w-full h-full object-cover" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaPreview} alt="Uppladdad annons" className="w-full h-full object-cover" />
    )
  ) : null;

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Skapa', 'Ad Studio']}
        right={
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hasContent}
            className="nordea-btn nordea-btn-cobalt disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? 'Analyserar…' : 'Analysera annons'}
          </button>
        }
      />

      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Analys · Virtual Focus Group"
          title="Ad Studio"
          description="Ladda upp en annons, se den i flödet och låt AI:n och personorna granska den innan den går ut."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
          {/* ── Scen: annonsen ── */}
          <div className="nordea-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-nordea-hairline">
              <SegmentedTabs<Placement>
                value={placement}
                onChange={changePlacement}
                tabs={[
                  { id: 'feed', label: 'I flödet', icon: LayoutList },
                  { id: 'story', label: 'Story', icon: Smartphone },
                  { id: 'raw', label: 'Original', icon: ImageIcon },
                  ...(mediaType === 'image' ? [{ id: 'attention' as const, label: 'Uppmärksamhet', icon: ScanEye }] : []),
                ]}
              />
              {mediaPreview && (
                <div className="flex items-center gap-2 min-w-0">
                  {mediaFile && <span className="text-[11px] text-nordea-text-tertiary truncate max-w-[180px]">{mediaFile.name}</span>}
                  <button type="button" onClick={removeMedia} className="nordea-btn nordea-btn-ghost nordea-btn-sm">
                    <X className="w-3 h-3" /> Byt
                  </button>
                </div>
              )}
            </div>

            <div
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleMediaUpload(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              className="relative min-h-[640px] flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,rgba(0,0,160,0.07),transparent_60%),radial-gradient(circle_at_1px_1px,rgba(0,0,94,0.07)_1px,transparent_0)] [background-size:100%_100%,22px_22px]"
            >
              {!mediaPreview ? (
                <label className="group cursor-pointer w-full max-w-md">
                  <div className="rounded-2xl border-2 border-dashed border-nordea-blue-line bg-white/70 backdrop-blur px-8 py-14 text-center transition-all group-hover:border-nordea-blue group-hover:bg-white">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-nordea-blue text-white flex items-center justify-center mb-4 shadow-[0_8px_24px_-6px_rgba(0,0,160,0.5)] transition-transform group-hover:-translate-y-0.5">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-nordea-text">Släpp din annons här</p>
                    <p className="text-sm text-nordea-text-tertiary mt-1">eller klicka för att välja — bild eller video</p>
                    <div className="flex justify-center gap-1.5 mt-5">
                      {['9:16', '4:5', '1:1', '16:9'].map((f) => <FormatChip key={f} ratio={f} />)}
                    </div>
                  </div>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])} />
                </label>
              ) : placement === 'attention' ? (
                attention && !attentionLoading ? (
                  <AttentionOverlay src={mediaPreview} points={attention.points} />
                ) : (
                  <div className="relative rounded-xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,94,0.3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaPreview} alt="Uppladdad annons" className="block max-h-[600px] max-w-full" />
                    <div className="absolute inset-0 bg-[#00005E]/35" />
                    <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-nordea-teal/40 to-transparent animate-[attention-scan_1.6s_ease-in-out_infinite]" />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 text-xs font-medium text-nordea-text inline-flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-nordea-blue" /> Uppskattar var blicken hamnar…
                      </span>
                    </div>
                  </div>
                )
              ) : placement === 'raw' ? (
                <div className="max-h-[600px] max-w-full rounded-xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,94,0.3)]">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="max-h-[600px] max-w-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaPreview} alt="Uppladdad annons" className="max-h-[600px] max-w-full" />
                  )}
                </div>
              ) : (
                <FeedMockup placement={placement} headline={headline} body={bodyText} cta={cta || 'Läs mer'} width={290}>
                  {mediaNode}
                </FeedMockup>
              )}
            </div>
          </div>

          {/* ── Höger: copy + persona ── */}
          <div className="space-y-5">
            <div className="nordea-card p-5">
              <SectionTitle
                title="Annonsens copy"
                right={detectedProduct && detectedProduct.category !== 'general' ? (
                  <NordeaBadge tone="cobalt" dot>{PRODUCT_LABELS[detectedProduct.category]}</NordeaBadge>
                ) : undefined}
              />
              <div className="space-y-3.5">
                <Field label="Rubrik">
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Drömhuset väntar — räkna på det idag" className="nordea-input w-full" />
                </Field>
                <Field label="Brödtext">
                  <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Vad vill du säga mer?" rows={3} className="nordea-input w-full h-auto py-2 resize-none leading-relaxed" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CTA">
                    <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Läs mer" className="nordea-input w-full" />
                  </Field>
                  <Field label="Kanal">
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger className="h-9 bg-white border-nordea-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta">Meta/Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="display">Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Persona */}
            <div className="nordea-card p-5">
              <SectionTitle
                title="Testa med persona"
                right={
                  <button type="button" onClick={() => router.push('/personas')} className="text-[11px] text-nordea-blue hover:underline inline-flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ny
                  </button>
                }
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {[...sortedPersonas.relevant, ...sortedPersonas.other].map((p) => {
                  const profile = findPersona(p.name);
                  const active = selectedPersona?.id === p.id;
                  const relevant = sortedPersonas.other.length > 0 && sortedPersonas.relevant.includes(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={`${profile?.name ?? p.name} — ${p.name}`}
                      onClick={() => { setSelectedPersona(p); setPersonaReaction(null); setChatMessages([]); }}
                      className={`relative rounded-xl transition-all ${active ? 'ring-2 ring-nordea-blue ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                    >
                      <PersonaImage name={profile?.name ?? p.name} color={profile?.color ?? 'from-nordea-blue to-nordea-deep'} size="md" />
                      {relevant && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nordea-teal ring-2 ring-white" title="Relevant för produkten" />}
                    </button>
                  );
                })}
              </div>

              {selectedPersona && (
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-nordea-text truncate">{selectedProfile?.name ?? selectedPersona.name}</p>
                    <p className="text-xs text-nordea-text-tertiary">{selectedPersona.name} · {selectedPersona.age_min}–{selectedPersona.age_max} år</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetReaction}
                    disabled={isLoadingReaction}
                    className="nordea-btn nordea-btn-primary nordea-btn-sm shrink-0 disabled:opacity-50"
                  >
                    {isLoadingReaction ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                    Få reaktion
                  </button>
                </div>
              )}

              {isLoadingReaction && (
                <div className="rounded-xl bg-nordea-bg p-4 space-y-2 animate-pulse">
                  <div className="h-3 rounded bg-nordea-blue-soft w-5/6" />
                  <div className="h-3 rounded bg-nordea-blue-soft w-4/6" />
                  <div className="h-3 rounded bg-nordea-blue-soft w-3/6" />
                </div>
              )}

              {personaReaction?.error && !isLoadingReaction && (
                <div className="rounded-xl border border-nordea-rose/20 bg-nordea-rose-soft px-4 py-3 text-[13px] text-nordea-rose">
                  Ingen reaktion: {personaReaction.error}
                </div>
              )}

              {personaReaction && !personaReaction.error && selectedPersona && !isLoadingReaction && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {personaReaction.mock && (
                    <div className="text-[11px] font-medium text-nordea-amber bg-nordea-amber-soft rounded-md px-2.5 py-1.5">
                      Exempelsvar — AI-nyckel saknas, detta är ingen simulering
                    </div>
                  )}
                  <div className="relative rounded-xl bg-nordea-bg px-4 py-3.5">
                    <Quote className="absolute -top-2 left-3 w-4 h-4 text-nordea-blue" />
                    <p className="text-[13px] text-nordea-text leading-relaxed">{personaReaction.impression}</p>
                  </div>

                  {personaReaction.sawVisual && (
                    <div className="flex items-start gap-2 text-[11px] text-nordea-text-tertiary">
                      <Eye className="w-3.5 h-3.5 shrink-0 mt-px text-nordea-teal" />
                      <span>
                        Bedömde {mediaType === 'video' ? 'bildrutor ur videon' : 'bilden'} + copy
                        {personaReaction.firstNoticed ? ` · Såg först: ${personaReaction.firstNoticed}` : ''}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-nordea-text-tertiary">Skulle klicka</span>
                      <span className="font-semibold text-nordea-text tabular-nums">{personaReaction.wouldClick} %</span>
                    </div>
                    <div className="h-2 rounded-full bg-nordea-blue-soft overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${personaReaction.wouldClick}%`,
                          backgroundColor: personaReaction.wouldClick >= 60 ? 'var(--nordea-teal)' : personaReaction.wouldClick >= 40 ? 'var(--nordea-amber)' : 'var(--nordea-rose)',
                        }}
                      />
                    </div>
                  </div>

                  {personaReaction.whatWorked && <Insight tone="green" label="Fungerade" text={personaReaction.whatWorked} />}
                  {personaReaction.suggestion && <Insight tone="cobalt" label="Förslag" text={personaReaction.suggestion} />}

                  {personaReaction.objections.length > 0 && (
                    <div>
                      <p className="nordea-eyebrow mb-2">Funderingar</p>
                      <div className="flex flex-col gap-1.5">
                        {personaReaction.objections.map((obj, i) => (
                          <span key={i} className="text-[12.5px] text-nordea-text-secondary rounded-lg border border-nordea-hairline px-3 py-2">{obj}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat */}
                  <div className="pt-4 border-t border-nordea-hairline">
                    {chatMessages.length > 0 && (
                      <ScrollArea className="h-40 mb-3">
                        <div className="space-y-2 pr-2">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <span className={`max-w-[85%] px-3 py-2 text-[12.5px] leading-relaxed ${msg.role === 'user' ? 'bg-nordea-blue text-white rounded-2xl rounded-br-md' : 'bg-nordea-bg text-nordea-text rounded-2xl rounded-bl-md'}`}>
                                {msg.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder={`Fråga ${(selectedProfile?.name ?? selectedPersona.name).split(' ')[0]}…`}
                        className="nordea-input flex-1"
                      />
                      <button type="button" onClick={handleSendChat} disabled={!chatInput.trim()} aria-label="Skicka" className="nordea-btn nordea-btn-cobalt w-9 px-0 disabled:opacity-40">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Fokusgrupp ── */}
        <div className="mt-5">
          <FocusGroupPanel
            personas={personas}
            getContext={getFocusGroupContext}
            disabled={!hasContent}
            runSignal={focusGroupSignal}
          />
        </div>

        {/* ── Resultat ── */}
        {(analysis || isAnalyzing) && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
            <div className="nordea-card p-6">
              {isAnalyzing || !analysis ? (
                <div className="flex items-center gap-6 animate-pulse">
                  <div className="w-[120px] h-[120px] rounded-full bg-nordea-blue-soft" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 rounded bg-nordea-blue-soft w-2/3" />
                    <div className="h-3 rounded bg-nordea-blue-soft w-full" />
                    <div className="h-3 rounded bg-nordea-blue-soft w-5/6" />
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-start gap-6">
                    <ScoreRing score={analysis.score} />
                    <div className="flex-1 min-w-0">
                      <div className="nordea-eyebrow mb-1.5">Helhetsbedömning</div>
                      <p className="text-[15px] text-nordea-text leading-relaxed mb-4">{analysis.summary}</p>
                      <div className="space-y-2">
                        {analysis.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            {issue.status === 'fail'
                              ? <X className="w-4 h-4 text-nordea-rose mt-0.5 shrink-0" />
                              : <AlertTriangle className="w-4 h-4 text-nordea-amber mt-0.5 shrink-0" />}
                            <span className="text-[13px] text-nordea-text-secondary">{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {analysis.videoAnalysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                      <VideoMetric label="Längd" value={`${Math.round(analysis.videoAnalysis.duration)} s`} />
                      <VideoMetric label="Hook (3 s)" value={`${analysis.videoAnalysis.hookScore}`} score={analysis.videoAnalysis.hookScore} />
                      <VideoMetric label="Tempo" value={`${analysis.videoAnalysis.pacingScore}`} score={analysis.videoAnalysis.pacingScore} />
                      <VideoMetric label="CTA-timing" value={analysis.videoAnalysis.ctaTiming} small />
                    </div>
                  )}

                  <button type="button" onClick={() => setShowDetails(!showDetails)} className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-nordea-blue hover:underline">
                    {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showDetails ? 'Dölj detaljer' : 'Visa detaljerad analys'}
                  </button>

                  {showDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-nordea-hairline">
                      <FeedbackList items={analysis.details.visual} title="Visuellt" />
                      <FeedbackList items={analysis.details.copy} title="Copy" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {mediaType === 'image' && (
              <div className="nordea-card p-5">
                <SectionTitle
                  title="Uppmärksamhet"
                  right={attention ? (
                    <NordeaBadge tone={attention.source === 'ai' ? 'teal' : 'neutral'}>
                      {attention.source === 'ai' ? 'AI-uppskattning' : 'Layoutuppskattning'}
                    </NordeaBadge>
                  ) : undefined}
                />
                {!attention || attentionLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 rounded bg-nordea-blue-soft w-2/3" />
                    <div className="h-3 rounded bg-nordea-blue-soft w-full" />
                    <div className="h-3 rounded bg-nordea-blue-soft w-4/5" />
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-in fade-in duration-500">
                    <div>
                      <div className="nordea-eyebrow mb-1">Ses först</div>
                      <p className="text-[15px] font-semibold text-nordea-text">{attention.first_seen}</p>
                    </div>
                    <p className="text-[13px] text-nordea-text-secondary leading-relaxed">{attention.summary}</p>
                    <ol className="space-y-1.5">
                      {[...attention.points].sort((a, b) => a.order - b.order).map((pt) => (
                        <li key={`${pt.order}-${pt.label}`} className="flex items-center gap-2.5 text-[13px] text-nordea-text">
                          <span className="w-5 h-5 rounded-full bg-nordea-blue-soft text-nordea-blue text-[10px] font-bold flex items-center justify-center shrink-0">{pt.order}</span>
                          <span className="flex-1 truncate">{pt.label}</span>
                          <span className="w-16 h-1.5 rounded-full bg-nordea-blue-soft overflow-hidden">
                            <span className="block h-full rounded-full bg-nordea-teal" style={{ width: `${pt.weight * 100}%` }} />
                          </span>
                        </li>
                      ))}
                    </ol>
                    {attention.warnings.length > 0 && (
                      <div className="space-y-1.5">
                        {attention.warnings.map((w) => (
                          <div key={w} className="flex items-start gap-2 text-[12.5px] text-nordea-text-secondary">
                            <AlertTriangle className="w-3.5 h-3.5 text-nordea-amber mt-0.5 shrink-0" /> {w}
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => changePlacement('attention')} className="nordea-btn nordea-btn-secondary nordea-btn-sm w-full">
                      <ScanEye className="w-3.5 h-3.5" /> Visa på annonsen
                    </button>
                    <p className="text-[10.5px] text-nordea-text-faint leading-snug">
                      Uppskattning av var blicken hamnar — inte eye-tracking. Använd som stöd, inte facit.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="nordea-eyebrow block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Insight({ tone, label, text }: { tone: 'green' | 'cobalt'; label: string; text: string }) {
  return (
    <div className={`rounded-xl px-3.5 py-2.5 ${tone === 'green' ? 'bg-nordea-green-soft' : 'bg-nordea-blue-soft'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] mb-0.5 ${tone === 'green' ? 'text-nordea-green' : 'text-nordea-blue'}`}>{label}</p>
      <p className="text-[13px] text-nordea-text leading-snug">{text}</p>
    </div>
  );
}

function VideoMetric({ label, value, score, small }: { label: string; value: string; score?: number; small?: boolean }) {
  return (
    <div className="rounded-xl bg-nordea-bg p-3.5">
      <p className="nordea-eyebrow text-[10px] mb-1">{label}</p>
      <p className={`font-semibold text-nordea-text ${small ? 'text-sm' : 'text-xl tabular-nums'}`}>{value}</p>
      {score !== undefined && (
        <div className="h-1 rounded-full bg-nordea-blue-soft mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-nordea-teal" style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  );
}
