'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Video,
  Send,
  MessageCircle,
  Plus,
  Clock,
  Zap,
  ChevronDown,
  Target,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  detectProductFromText,
  getRelevantPersonas,
  PRODUCT_LABELS,
  type ProductCategory,
  type ProductMatch,
} from '@/lib/product-detection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaType = 'image' | 'video' | null;

interface AnalysisSummary {
  overallScore: number;
  headline: string;
  topIssues: Array<{ severity: 'pass' | 'warning' | 'fail'; text: string }>;
  detectedProduct: ProductMatch;
}

interface AnalysisResult {
  mediaType: MediaType;
  visualScore: number;
  copyScore: number;
  overallScore: number;
  brandFitScore?: number;
  complianceScore?: number;
  visualFeedback: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
  copyFeedback: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
  holisticFeedback: Array<{ status: 'pass' | 'warning' | 'fail'; message: string }>;
  suggestions: string[];
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

interface PersonaFeedback {
  impression: string;
  clickProbability: number;
  concerns: string[];
  relevanceScore?: number;
  whatWorked?: string;
  suggestion?: string;
  videoSpecific?: {
    hookReaction: string;
    watchTime: string;
    dropOffPoint?: string;
  };
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
  mediaType: 'image',
  visualScore: 78,
  copyScore: 85,
  overallScore: 82,
  brandFitScore: 80,
  complianceScore: 65,
  visualFeedback: [
    { status: 'pass', message: 'Bildkvalitet är god (hög upplösning)' },
    { status: 'pass', message: 'Nordea-logotyp korrekt placerad' },
    { status: 'warning', message: 'Kontrasten kan förbättras på CTA' },
  ],
  copyFeedback: [
    { status: 'pass', message: 'Rubriken är tydlig och kortfattad' },
    { status: 'pass', message: 'Tone of Voice stämmer med riktlinjer' },
    { status: 'fail', message: 'Disclaimer saknas för finansiell produkt' },
  ],
  holisticFeedback: [
    { status: 'pass', message: 'Bild och budskap hänger ihop' },
    { status: 'warning', message: 'CTA kunde vara mer framträdande i bilden' },
  ],
  suggestions: [
    'Lägg till riskdisclaimer för finansiella produkter',
    'Öka kontrasten på CTA-knappen',
    'Placera CTA ovanför folden',
  ],
};

const mockVideoAnalysis: AnalysisResult = {
  mediaType: 'video',
  visualScore: 75,
  copyScore: 82,
  overallScore: 79,
  brandFitScore: 85,
  complianceScore: 60,
  visualFeedback: [
    { status: 'pass', message: 'Videokvalitet är god (1080p)' },
    { status: 'pass', message: 'Nordea-branding synlig genom hela videon' },
    { status: 'warning', message: 'Textöverlägg svårlästa i vissa frames' },
  ],
  copyFeedback: [
    { status: 'pass', message: 'Budskapet är tydligt' },
    { status: 'warning', message: 'CTA kommer sent (efter 12 sek)' },
    { status: 'fail', message: 'Disclaimer saknas' },
  ],
  holisticFeedback: [
    { status: 'pass', message: 'Videon fångar uppmärksamhet direkt' },
    { status: 'warning', message: 'Tempo kan ökas i mittensektionen' },
    { status: 'pass', message: 'Stark avslutning med tydlig CTA' },
  ],
  suggestions: [
    'Flytta CTA till tidigare i videon (inom 8 sek)',
    'Lägg till undertexter för ljudlös visning',
    'Öka tempot i mittensektionen',
  ],
  videoAnalysis: {
    duration: 15,
    hookScore: 85,
    pacingScore: 68,
    ctaTiming: 'Sen (12s) – rekommenderat inom 8s',
  },
};

const mockPersonaFeedback: Record<string, PersonaFeedback> = {
  'Ung Förstagångsköpare': {
    impression: 'Den här annonsen fångar min uppmärksamhet. Relevant för mig, men jag vill veta mer om vad som händer efter jag klickar.',
    clickProbability: 72,
    concerns: ['Vad händer efter klick?', 'Hur lång tid tar processen?'],
    relevanceScore: 85,
    whatWorked: 'Tydligt budskap och enkel CTA',
    suggestion: 'Lägg till ett konkret prisexempel',
    videoSpecific: { hookReaction: 'Första 3 sekunderna fångade mig', watchTime: 'Skulle titta klart (15 sek)' },
  },
  'Spararen': {
    impression: 'Professionellt, men för vagt. Jag vill se konkreta siffror och jämförelser.',
    clickProbability: 45,
    concerns: ['Var är siffrorna?', 'Hur jämför ni med andra?'],
    relevanceScore: 60,
    whatWorked: 'Professionell känsla',
    suggestion: 'Visa konkret avkastning eller jämförelse',
    videoSpecific: { hookReaction: 'Intressant start men tappade mig i mitten', watchTime: 'Scrollar vidare efter 8 sek', dropOffPoint: '8 sekunder' },
  },
  'Familjeföräldern': {
    impression: 'Snabbt och enkelt budskap – perfekt när man har ont om tid.',
    clickProbability: 78,
    concerns: ['Hur lång tid tar det?', 'Kan jag spara och fortsätta sen?'],
    relevanceScore: 75,
    whatWorked: 'Kort och kärnfullt, respekterar min tid',
    suggestion: 'Nämn att det går att göra i appen',
    videoSpecific: { hookReaction: 'Bra att det går snabbt till poängen', watchTime: 'Skulle titta klart om under 20 sek' },
  },
  'Pensionsspararen': {
    impression: 'Lite för snabbt och digitalt. Saknar mänsklig kontakt.',
    clickProbability: 35,
    concerns: ['Kan jag prata med någon?', 'Finns telefonnummer?'],
    relevanceScore: 40,
    whatWorked: 'Bra att ämnet tas upp',
    suggestion: 'Erbjud möjlighet att boka rådgivning',
    videoSpecific: { hookReaction: 'Texten går för fort', watchTime: 'Pausar eller scrollar vidare', dropOffPoint: '5 sekunder' },
  },
};

// ---------------------------------------------------------------------------
// Helper: generate summary from analysis
// ---------------------------------------------------------------------------

function generateSummary(
  result: AnalysisResult,
  product: ProductMatch
): AnalysisSummary {
  const allFeedback = [
    ...result.visualFeedback,
    ...result.copyFeedback,
    ...result.holisticFeedback,
  ];

  const issues = allFeedback
    .filter((f) => f.status !== 'pass')
    .sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1))
    .slice(0, 3)
    .map((f) => ({ severity: f.status, text: f.message }));

  let headline: string;
  if (result.overallScore >= 80) {
    headline = 'Stark annons med mindre justeringar';
  } else if (result.overallScore >= 60) {
    headline = 'Bra grund – behöver finjusteras';
  } else {
    headline = 'Behöver betydande förbättringar';
  }

  return {
    overallScore: result.overallScore,
    headline,
    topIssues: issues,
    detectedProduct: product,
  };
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 80 ? '#40BFA3' : score >= 60 ? '#FFE183' : '#FC6161';
  const bgColor = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  const textColor = score >= 80 ? 'text-green-700' : score >= 60 ? 'text-yellow-700' : 'text-red-700';
  const sz = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';
  const textSz = size === 'lg' ? 'text-2xl' : 'text-lg';
  const radius = size === 'lg' ? 35 : 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const svgSize = size === 'lg' ? 80 : 56;

  return (
    <div className={`${sz} relative rounded-full ${bgColor} flex items-center justify-center`}>
      <svg className="absolute inset-0" width={svgSize} height={svgSize}>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={size === 'lg' ? 4 : 3}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size === 'lg' ? 4 : 3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        />
      </svg>
      <span className={`${textSz} font-bold ${textColor} relative z-10`}>{score}</span>
    </div>
  );
}

function ScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon?: React.ComponentType<{ className?: string }> }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      {Icon && <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />}
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{score}</p>
    </div>
  );
}

function FeedbackItem({ status, message }: { status: 'pass' | 'warning' | 'fail'; message: string }) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'warning' ? AlertTriangle : XCircle;
  const color = status === 'pass' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500';
  const bg = status === 'pass' ? 'bg-green-50' : status === 'warning' ? 'bg-yellow-50' : 'bg-red-50';
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
      <span className="text-sm text-gray-700">{message}</span>
    </div>
  );
}

function IssueItem({ severity, text }: { severity: 'pass' | 'warning' | 'fail'; text: string }) {
  const Icon = severity === 'fail' ? XCircle : AlertTriangle;
  const color = severity === 'fail' ? 'text-red-500' : 'text-yellow-500';
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdStudioPage() {
  const router = useRouter();
  const supabase = createClient();

  // Media state
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Copy state
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [cta, setCta] = useState('');
  const [channel, setChannel] = useState('meta');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Product detection
  const [detectedProduct, setDetectedProduct] = useState<ProductMatch | null>(null);

  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaFeedback, setPersonaFeedback] = useState<PersonaFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
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

  // Auto-detect product when copy changes
  useEffect(() => {
    if (headline || bodyText || cta) {
      const product = detectProductFromText(headline, bodyText, cta);
      setDetectedProduct(product);
    } else {
      setDetectedProduct(null);
    }
  }, [headline, bodyText, cta]);

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
      }
    };
    fetchPersonas();
  }, [supabase]);

  // Sort personas by relevance when product changes
  const sortedPersonas = (() => {
    if (!detectedProduct || detectedProduct.category === 'general') {
      return { relevant: personas, other: [] as Persona[] };
    }

    const relevanceMap = getRelevantPersonas(
      detectedProduct.category,
      personas.map((p) => p.name)
    );

    const relevant: Persona[] = [];
    const other: Persona[] = [];

    for (const p of personas) {
      const match = relevanceMap.find((r) => r.name === p.name);
      if (match?.isRelevant) {
        relevant.push(p);
      } else {
        other.push(p);
      }
    }

    return { relevant, other };
  })();

  // Auto-select first relevant persona when product changes
  useEffect(() => {
    if (sortedPersonas.relevant.length > 0 && detectedProduct?.category !== 'general') {
      const firstRelevant = sortedPersonas.relevant[0];
      if (!selectedPersona || !sortedPersonas.relevant.find((p) => p.id === selectedPersona.id)) {
        setSelectedPersona(firstRelevant);
      }
    }
  }, [detectedProduct, sortedPersonas.relevant, selectedPersona]);

  // Handle media upload
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      handleMediaUpload(file);
    }
  }, [handleMediaUpload]);

  const removeMedia = () => {
    if (mediaPreview && mediaType === 'video') URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setAnalysis(null);
    setSummary(null);
  };

  // Analyze
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setSummary(null);
    setPersonaFeedback(null);
    setDetailsOpen(false);

    const product = detectProductFromText(headline, bodyText, cta);
    setDetectedProduct(product);

    try {
      let result: AnalysisResult;

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
          body: JSON.stringify({
            frames: framesForApi,
            duration: metadata.duration,
            headline,
            bodyText,
            cta,
            channel,
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze video');
        const data = await response.json();

        result = {
          mediaType: 'video',
          visualScore: data.scores?.branding || 75,
          copyScore: data.scores?.overall || 72,
          overallScore: data.scores?.overall || 72,
          brandFitScore: data.scores?.branding || 75,
          complianceScore: data.scores?.compliance || 60,
          visualFeedback: data.brandingAnalysis
            ? [
                { status: 'pass' as const, message: `Branding: ${data.brandingAnalysis.brandFit}` },
                { status: (data.scores?.hook >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `Hook (3s): ${data.hookAnalysis?.feedback || 'Analyserad'}` },
              ]
            : mockVideoAnalysis.visualFeedback,
          copyFeedback: data.ctaAnalysis
            ? [
                { status: (data.scores?.ctaTiming >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `CTA Timing: ${data.ctaAnalysis.timing}` },
                ...(data.complianceIssues || []).map((ci: { severity: string; issue: string }) => ({
                  status: (ci.severity === 'high' ? 'fail' : 'warning') as 'pass' | 'warning' | 'fail',
                  message: ci.issue,
                })),
              ]
            : mockVideoAnalysis.copyFeedback,
          holisticFeedback: data.silentViewability
            ? [
                { status: (data.silentViewability.score >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `Ljudlös visning: ${data.silentViewability.feedback}` },
                { status: (data.scores?.pacing >= 70 ? 'pass' : 'warning') as 'pass' | 'warning', message: `Pacing: ${data.pacingAnalysis?.feedback || 'Analyserad'}` },
              ]
            : mockVideoAnalysis.holisticFeedback,
          suggestions: data.suggestions || [],
          videoAnalysis: {
            duration: metadata.duration,
            hookScore: data.scores?.hook || data.hookAnalysis?.score || 75,
            pacingScore: data.scores?.pacing || data.pacingAnalysis?.score || 70,
            ctaTiming: data.ctaAnalysis?.timing || 'Analyserad',
          },
        };
      } else if (mediaType === 'image' && mediaPreview) {
        const base64 = mediaPreview.split(',')[1];
        const mimeType = mediaPreview.split(';')[0].split(':')[1];

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mediaType: mimeType,
            headline,
            bodyText,
            cta,
            channel,
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze image');
        const data = await response.json();

        result = {
          mediaType: 'image',
          visualScore: data.scores?.visual || 78,
          copyScore: data.scores?.copy || 85,
          overallScore: data.scores?.overall || 82,
          brandFitScore: data.scores?.brandFit || 80,
          complianceScore: data.scores?.compliance || 65,
          visualFeedback: data.visualAnalysis?.feedback || mockImageAnalysis.visualFeedback,
          copyFeedback: data.copyAnalysis?.feedback || mockImageAnalysis.copyFeedback,
          holisticFeedback: data.holisticAnalysis?.feedback || mockImageAnalysis.holisticFeedback,
          suggestions: data.suggestions || [],
        };
      } else {
        // Text-only analysis
        await new Promise((r) => setTimeout(r, 1500));
        result = mockImageAnalysis;
      }

      setAnalysis(result);
      setSummary(generateSummary(result, product));
    } catch (error) {
      console.error('Error analyzing:', error);
      const fallback = mediaType === 'video' ? mockVideoAnalysis : mockImageAnalysis;
      setAnalysis(fallback);
      setSummary(generateSummary(fallback, product));
    } finally {
      setIsAnalyzing(false);
    }

    // Auto-fetch persona feedback for the selected persona
    if (selectedPersona) {
      handleGetPersonaFeedback();
    }
  };

  // Persona feedback
  const handleGetPersonaFeedback = async () => {
    if (!selectedPersona) return;
    setIsLoadingFeedback(true);
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
      setPersonaFeedback({
        impression: data.firstImpression || 'Intressant annons.',
        clickProbability: data.wouldClick || 50,
        concerns: data.objections || [],
        relevanceScore: data.relevance?.score ?? undefined,
        whatWorked: data.whatWorked || undefined,
        suggestion: data.suggestion || undefined,
        videoSpecific: data.videoSpecific || undefined,
      });
    } catch (error) {
      console.error('Error getting persona feedback:', error);
      const feedback = mockPersonaFeedback[selectedPersona.name] || mockPersonaFeedback['Spararen'];
      setPersonaFeedback(feedback);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Chat
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
          personaAge: selectedPersona.age_min ? { min: selectedPersona.age_min, max: selectedPersona.age_max || selectedPersona.age_min + 10 } : undefined,
          responseStyle: selectedPersona.response_style,
          messages: [...chatMessages, userMsg].map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          adContext: { headline, body: bodyText, cta, channel },
          newMessage: msg,
          productCategory: product.category,
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

  const hasContent = mediaPreview || headline.trim() || bodyText.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Studio</h1>
        <p className="text-gray-500 mt-1">Analysera kompletta annonser – bild, video och copy tillsammans</p>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media upload */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {mediaType === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              Kreativt material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                mediaPreview ? 'border-[#0000A0] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {mediaPreview ? (
                <div className="space-y-4">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline">
                      {mediaType === 'video' ? <><Video className="w-3 h-3 mr-1" />Video</> : <><ImageIcon className="w-3 h-3 mr-1" />Bild</>}
                    </Badge>
                    {mediaFile && <span className="text-xs text-gray-400">{mediaFile.name}</span>}
                    <Button variant="outline" size="sm" onClick={removeMedia}>Byt fil</Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <Video className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Dra & släpp eller klicka för att ladda upp</p>
                  <p className="text-xs text-gray-400">Bild (PNG, JPG) eller Video (MP4, MOV, WebM)</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            {mediaType === 'video' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-[#0000A0] font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Video-analys aktiverad
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Vi analyserar hook (första 3 sek), pacing, CTA-timing och brand consistency.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Copy input */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Annonsinnehåll</CardTitle>
              {detectedProduct && detectedProduct.category !== 'general' && (
                <Badge variant="outline" className="text-[#0000A0] border-[#0000A0]/30">
                  <Target className="w-3 h-3 mr-1" />
                  {PRODUCT_LABELS[detectedProduct.category]}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kanal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta/Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rubrik</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Annonsens rubrik..." />
            </div>
            <div className="space-y-2">
              <Label>Brödtext</Label>
              <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Annonsens brödtext..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>CTA</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Call to action..." />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !hasContent}
        className="w-full h-12 bg-[#0000A0] hover:bg-[#000080]"
      >
        {isAnalyzing ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyserar {mediaType === 'video' ? 'video' : 'annons'}...</>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" />Analysera komplett annons</>
        )}
      </Button>

      {/* ===== RESULTS ===== */}
      {summary && analysis && (
        <div className="space-y-6">

          {/* ── Summary Card ── */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#0000A0] to-[#0000FF] p-6 text-white">
              <div className="flex items-center gap-6">
                <ScoreRing score={summary.overallScore} />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{summary.headline}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {summary.detectedProduct.category !== 'general' && (
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                        <Target className="w-3 h-3 mr-1" />
                        {PRODUCT_LABELS[summary.detectedProduct.category]}
                      </Badge>
                    )}
                    {mediaType && (
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                        {mediaType === 'video' ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                        {mediaType === 'video' ? 'Video' : 'Bild'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Issues */}
            {summary.topIssues.length > 0 && (
              <div className="p-4 bg-gray-50 border-t">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Viktigaste att åtgärda</p>
                <div className="space-y-1.5">
                  {summary.topIssues.map((issue, i) => (
                    <IssueItem key={i} severity={issue.severity} text={issue.text} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick scores row */}
            <div className="p-4 grid grid-cols-3 md:grid-cols-5 gap-3">
              <ScoreCard label="Visuellt" score={analysis.visualScore} icon={mediaType === 'video' ? Video : ImageIcon} />
              <ScoreCard label="Copy" score={analysis.copyScore} icon={MessageCircle} />
              <ScoreCard label="Helhet" score={analysis.overallScore} icon={Sparkles} />
              {analysis.brandFitScore != null && (
                <ScoreCard label="Varumärke" score={analysis.brandFitScore} icon={Target} />
              )}
              {analysis.complianceScore != null && (
                <ScoreCard label="Compliance" score={analysis.complianceScore} icon={CheckCircle2} />
              )}
            </div>
          </Card>

          {/* ── Video-specific card ── */}
          {analysis.videoAnalysis && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video-analys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Längd</p>
                    <p className="font-semibold">{analysis.videoAnalysis.duration}s</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-xs text-gray-500">Hook (3s)</p>
                    <p className={`font-semibold ${analysis.videoAnalysis.hookScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {analysis.videoAnalysis.hookScore}/100
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Sparkles className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-gray-500">Pacing</p>
                    <p className={`font-semibold ${analysis.videoAnalysis.pacingScore >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {analysis.videoAnalysis.pacingScore}/100
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-gray-500">CTA-timing</p>
                    <p className="font-semibold text-sm">{analysis.videoAnalysis.ctaTiming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Collapsible Detailed Analysis ── */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl">
                  <span className="font-medium text-sm text-gray-700">Detaljerad analys</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500">Visuell feedback</h3>
                      {analysis.visualFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500">Copy-feedback</h3>
                      {analysis.copyFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500">Helhetsbedömning</h3>
                    {analysis.holisticFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                  </div>

                  {analysis.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500">Förslag</h3>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-[#0000A0] shrink-0 mt-0.5" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ── Persona Focus Group ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Virtual Focus Group
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Smart persona selector */}
              <div className="space-y-2">
                <Label>Välj persona</Label>
                <Select
                  value={selectedPersona?.id || ''}
                  onValueChange={(v) => {
                    if (v === 'create-new') {
                      router.push('/personas');
                    } else {
                      const p = personas.find((px) => px.id === v);
                      if (p) {
                        setSelectedPersona(p);
                        setPersonaFeedback(null);
                        setChatMessages([]);
                      }
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Välj persona..." /></SelectTrigger>
                  <SelectContent>
                    {sortedPersonas.relevant.length > 0 && sortedPersonas.other.length > 0 && (
                      <div className="px-2 py-1.5">
                        <span className="text-xs font-medium text-[#0000A0]">Relevanta personas</span>
                      </div>
                    )}
                    {sortedPersonas.relevant.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          {p.avatar} {p.name}
                          {detectedProduct && detectedProduct.category !== 'general' && (
                            <span className="text-[10px] bg-[#0000A0]/10 text-[#0000A0] px-1.5 py-0.5 rounded-full">Relevant</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                    {sortedPersonas.other.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 mt-1 border-t">
                          <span className="text-xs font-medium text-gray-400">Övriga personas</span>
                        </div>
                        {sortedPersonas.other.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.avatar} {p.name}</SelectItem>
                        ))}
                      </>
                    )}
                    <SelectItem value="create-new" className="text-[#0000A0]">
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Skapa ny persona</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGetPersonaFeedback}
                disabled={!selectedPersona || isLoadingFeedback}
                className="w-full bg-[#0000A0] hover:bg-[#000080]"
              >
                {isLoadingFeedback ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Hämtar feedback...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Få persona-feedback</>
                )}
              </Button>

              {personaFeedback && selectedPersona && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Impression */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{selectedPersona.avatar}</span>
                      <span className="font-medium text-sm">{selectedPersona.name}</span>
                    </div>
                    <p className="text-sm italic text-gray-700">&quot;{personaFeedback.impression}&quot;</p>
                  </div>

                  {/* Key metrics row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <Label className="text-xs text-gray-500">Klicksannolikhet</Label>
                      <Badge className={personaFeedback.clickProbability >= 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {personaFeedback.clickProbability}%
                      </Badge>
                    </div>
                    {personaFeedback.relevanceScore != null && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <Label className="text-xs text-gray-500">Relevans</Label>
                        <Badge className={personaFeedback.relevanceScore >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                          {personaFeedback.relevanceScore}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* What worked */}
                  {personaFeedback.whatWorked && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">Vad som fungerade</p>
                      <p className="text-sm text-gray-700">{personaFeedback.whatWorked}</p>
                    </div>
                  )}

                  {/* Suggestion */}
                  {personaFeedback.suggestion && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-[#0000A0] mb-1">Förslag</p>
                      <p className="text-sm text-gray-700">{personaFeedback.suggestion}</p>
                    </div>
                  )}

                  {/* Concerns */}
                  {personaFeedback.concerns.length > 0 && (
                    <div>
                      <Label className="text-xs text-gray-500">Funderingar</Label>
                      <ul className="mt-1 space-y-1">
                        {personaFeedback.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-gray-600">&#x2022; {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Video-specific */}
                  {personaFeedback.videoSpecific && mediaType === 'video' && (
                    <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-[#0000A0]">Video-specifikt</p>
                      <p className="text-sm text-gray-700"><strong>Hook-reaktion:</strong> {personaFeedback.videoSpecific.hookReaction}</p>
                      <p className="text-sm text-gray-700"><strong>Uppskattad tittartid:</strong> {personaFeedback.videoSpecific.watchTime}</p>
                      {personaFeedback.videoSpecific.dropOffPoint && (
                        <p className="text-sm text-red-600"><strong>Tappar intresset vid:</strong> {personaFeedback.videoSpecific.dropOffPoint}</p>
                      )}
                    </div>
                  )}

                  {/* Chat */}
                  <div className="pt-4 border-t">
                    <Label className="text-xs text-gray-500 mb-2 block">Diskutera med {selectedPersona.name}</Label>
                    <ScrollArea className="h-[180px] mb-3">
                      <div className="space-y-2">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              msg.role === 'user' ? 'bg-[#0000A0] text-white' : 'bg-gray-100'
                            }`}>
                              {msg.role === 'persona' && (
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
                        placeholder={`Fråga ${selectedPersona.name}...`}
                      />
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
      )}
    </div>
  );
}
