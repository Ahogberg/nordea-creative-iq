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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaType = 'image' | 'video' | null;

interface AnalysisResult {
  mediaType: MediaType;
  visualScore: number;
  copyScore: number;
  overallScore: number;
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
}

interface PersonaFeedback {
  impression: string;
  clickProbability: number;
  concerns: string[];
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
    videoSpecific: { hookReaction: 'Första 3 sekunderna fångade mig', watchTime: 'Skulle titta klart (15 sek)' },
  },
  'Spararen': {
    impression: 'Professionellt, men för vagt. Jag vill se konkreta siffror och jämförelser.',
    clickProbability: 45,
    concerns: ['Var är siffrorna?', 'Hur jämför ni med andra?'],
    videoSpecific: { hookReaction: 'Intressant start men tappade mig i mitten', watchTime: 'Scrollar vidare efter 8 sek', dropOffPoint: '8 sekunder' },
  },
  'Familjeföräldern': {
    impression: 'Snabbt och enkelt budskap – perfekt när man har ont om tid.',
    clickProbability: 78,
    concerns: ['Hur lång tid tar det?', 'Kan jag spara och fortsätta sen?'],
    videoSpecific: { hookReaction: 'Bra att det går snabbt till poängen', watchTime: 'Skulle titta klart om under 20 sek' },
  },
  'Pensionsspararen': {
    impression: 'Lite för snabbt och digitalt. Saknar mänsklig kontakt.',
    clickProbability: 35,
    concerns: ['Kan jag prata med någon?', 'Finns telefonnummer?'],
    videoSpecific: { hookReaction: 'Texten går för fort', watchTime: 'Pausar eller scrollar vidare', dropOffPoint: '5 sekunder' },
  },
};

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

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
  };

  // Analyze
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setPersonaFeedback(null);

    await new Promise((r) => setTimeout(r, 2000));
    setAnalysis(mediaType === 'video' ? mockVideoAnalysis : mockImageAnalysis);
    setIsAnalyzing(false);

    // Auto-fetch persona feedback
    if (selectedPersona) {
      handleGetPersonaFeedback();
    }
  };

  // Persona feedback
  const handleGetPersonaFeedback = async () => {
    if (!selectedPersona) return;
    setIsLoadingFeedback(true);
    setChatMessages([]);

    await new Promise((r) => setTimeout(r, 1000));
    const feedback = mockPersonaFeedback[selectedPersona.name] || mockPersonaFeedback['Spararen'];
    setPersonaFeedback(feedback);
    setIsLoadingFeedback(false);
  };

  // Chat
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
          adContent: `Rubrik: ${headline}\nBrödtext: ${bodyText}\nCTA: ${cta}`,
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
            <CardTitle className="text-base">Annonsinnehåll</CardTitle>
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

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-4">
            <ScoreCard label="Visuellt" score={analysis.visualScore} icon={mediaType === 'video' ? Video : ImageIcon} />
            <ScoreCard label="Copy" score={analysis.copyScore} icon={MessageCircle} />
            <ScoreCard label="Helhet" score={analysis.overallScore} icon={Sparkles} />
          </div>

          {/* Video-specific analysis */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Visuell feedback</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.visualFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Copy-feedback</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.copyFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Helhetsbedömning</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.holisticFeedback.map((f, i) => <FeedbackItem key={i} {...f} />)}
                </CardContent>
              </Card>
              {analysis.suggestions.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-base">Förslag</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-[#0000A0] mt-0.5">&#x2022;</span>{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Persona feedback */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Persona-feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      {personas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.avatar} {p.name}</SelectItem>
                      ))}
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
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{selectedPersona.avatar}</span>
                        <span className="font-medium text-sm">{selectedPersona.name}</span>
                      </div>
                      <p className="text-sm italic text-gray-700">&quot;{personaFeedback.impression}&quot;</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-gray-500">Klicksannolikhet</Label>
                      <Badge className={personaFeedback.clickProbability >= 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {personaFeedback.clickProbability}%
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Funderingar</Label>
                      <ul className="mt-1 space-y-1">
                        {personaFeedback.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-gray-600">&#x2022; {c}</li>
                        ))}
                      </ul>
                    </div>

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
        </div>
      )}
    </div>
  );
}
