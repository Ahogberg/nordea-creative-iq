'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Send,
  MessageCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  label: string;
}

interface ComplianceItem {
  status: 'pass' | 'warning' | 'fail';
  category: string;
  message: string;
}

interface Suggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
}

interface AnalysisResult {
  brandFit: number;
  performance: number;
  compliance: number;
  heatmapData: HeatmapPoint[];
  complianceItems: ComplianceItem[];
  suggestions: Suggestion[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'persona';
  content: string;
  timestamp: Date;
}

interface PersonaTab {
  id: string;
  name: string;
  avatar: string;
  responseStyle: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockAnalysis: AnalysisResult = {
  brandFit: 78,
  performance: 72,
  compliance: 85,
  heatmapData: [
    { x: 50, y: 15, intensity: 0.95, label: 'Rubrik' },
    { x: 50, y: 45, intensity: 0.8, label: 'Bild' },
    { x: 50, y: 75, intensity: 0.7, label: 'CTA' },
    { x: 15, y: 10, intensity: 0.6, label: 'Logo' },
    { x: 80, y: 85, intensity: 0.5, label: 'Disclaimer' },
  ],
  complianceItems: [
    { status: 'pass', category: 'logo', message: 'Nordea-logotyp korrekt placerad' },
    { status: 'pass', category: 'contrast', message: 'Textkontrast uppfyller WCAG AA' },
    { status: 'warning', category: 'disclaimer', message: 'Riskdisclaimer saknas för investeringsprodukt' },
    { status: 'pass', category: 'terminology', message: 'Korrekt terminologi används' },
    { status: 'fail', category: 'legal', message: 'Effektiv ränta måste anges tydligare' },
  ],
  suggestions: [
    { type: 'visual', priority: 'high', message: 'Öka kontrasten på CTA-knappen för bättre synlighet' },
    { type: 'copy', priority: 'medium', message: 'Förenkla rubriken – använd max 8 ord för LinkedIn' },
    { type: 'compliance', priority: 'high', message: 'Lägg till riskdisclaimer: "Historisk avkastning är ingen garanti..."' },
    { type: 'performance', priority: 'medium', message: 'Placera CTA ovanför folden för bättre konvertering' },
  ],
};

const personas: PersonaTab[] = [
  { id: 'young', name: 'Ung Förstagångsköpare', avatar: '🏠', responseStyle: 'curious' },
  { id: 'saver', name: 'Spararen', avatar: '💰', responseStyle: 'neutral' },
  { id: 'parent', name: 'Familjeföräldern', avatar: '👨‍👩‍👧‍👦', responseStyle: 'neutral' },
  { id: 'retiree', name: 'Pensionsspararen', avatar: '🌅', responseStyle: 'skeptical' },
];

const personaMockResponses: Record<string, string[]> = {
  young: [
    'Hmm, annonsens rubrik är ganska catchy, men jag vill veta mer om de faktiska kostnaderna. Vad är den effektiva räntan? Det står inte tydligt nog.',
    'Jag gillar att designen är ren och modern, men det känns lite som "typisk bank". Hade velat se mer transparens – visa mig reella siffror, inte bara "förmånlig ränta".',
    'CTA:n "Ansök nu" ger mig lite panik. Kan ni inte ha något mjukare, typ "Räkna på ditt bolån" så jag kan utforska först utan att committa?',
    'Appen ser snygg ut i bilden, men funkar den verkligen så smidigt? Jag har laddat ner massa bank-appar som inte levde upp till löftet.',
    'Det saknas info om vad som händer efter att jag klickar. Blir jag uppringd? Får jag ett mail? Jag vill veta processen innan jag ger ifrån mig mina uppgifter.',
  ],
  saver: [
    'Jag förstår att ni vill locka med avkastning, men var är jämförelsen? Hur står sig era fonder mot Avanza eller Lysa? Visa mig siffror.',
    'Avgifterna nämns inte alls i annonsen. Det är det första jag kollar. Utan den infon scrollar jag bara vidare.',
    'Designen är lugn och professionell, det gillar jag. Men budskapet är för vagt – "Låt pengarna växa" säger ingenting konkret.',
    'Hade uppskattad en enkel kalkyl direkt i annonsen. Typ: "Spara 2 000 kr/mån i 10 år = X kr med Y% avkastning".',
    'Disclaimern behöver finnas med. Jag ser direkt att den saknas och då tappar jag förtroende för hela annonsen.',
  ],
  parent: [
    'Snabb tanke: jag ser inte direkt vad erbjudandet är. Jag har typ 5 sekunder innan barnen kräver uppmärksamhet, så budskapet måste vara kristallklart.',
    'Barnperspektivet saknas helt. Visa mig att ni förstår att jag sparar för DERAS skull, inte bara min egen. Det hade gjort att jag stannade kvar.',
    'Bra att det finns en tydlig knapp, men kan ni lägga till "Tar 2 minuter" eller liknande? Jag behöver veta att det inte stjäl min kväll.',
    'Designen känns vuxen och seriös – bra. Men kanske lite för stel? En touch värme, en familj-bild eller liknande, hade gjort stor skillnad.',
    'Finns det en "automatisk"-funktion? Typ att jag sätter igång ett månadssparande och sen sköter sig allt? Lyft det i annonsen isf.',
  ],
  retiree: [
    'Texten är för liten för mig. Om jag behöver zooma in för att läsa villkoren så stänger jag sidan direkt. Och var är telefonnumret?',
    'Jag vill inte klicka på "Ansök nu" utan att först prata med någon. Finns det ingen möjlighet att boka ett möte istället? Det borde stå i annonsen.',
    'Ni skriver "digital rådgivning" – men vad innebär det egentligen? Är det en chatbot? Jag vill prata med en riktig människa som förstår min situation.',
    'Annonsen ser professionell ut, det ska ni ha. Men jag saknar trygghetskänslan. Visa mig att mina pengar är säkra, det är det enda jag bryr mig om nu.',
    'Pensionssystemet är redan förvirrande nog. Förenkla budskapet. Berätta för mig vad jag BEHÖVER göra, inte alla alternativ som finns.',
  ],
};

// ---------------------------------------------------------------------------
// Score Ring component
// ---------------------------------------------------------------------------

function ScoreRing({
  score,
  size = 96,
  label,
}: {
  score: number;
  size?: number;
  label: string;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#00A76F' : score >= 60 ? '#F59E0B' : '#DC3545';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="7"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Heatmap overlay component
// ---------------------------------------------------------------------------

function HeatmapOverlay({ points }: { points: HeatmapPoint[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {points.map((point, i) => {
        const size = 40 + point.intensity * 60;
        const opacity = 0.25 + point.intensity * 0.45;
        const bgColor =
          point.intensity >= 0.85
            ? 'bg-red-500'
            : point.intensity >= 0.7
              ? 'bg-orange-400'
              : point.intensity >= 0.55
                ? 'bg-yellow-400'
                : 'bg-blue-400';

        return (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`rounded-full ${bgColor} blur-sm`}
              style={{
                width: size,
                height: size,
                opacity,
              }}
            />
            <span className="mt-1 text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance icon helper
// ---------------------------------------------------------------------------

function ComplianceIcon({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-[#00A76F] shrink-0" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />;
  return <XCircle className="w-4 h-4 text-[#DC3545] shrink-0" />;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AdStudioPage() {
  // Upload & input state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adCopy, setAdCopy] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Heatmap toggle
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Focus group chat state
  const [activePersona, setActivePersona] = useState(personas[0].id);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    personas.forEach((p) => {
      initial[p.id] = [];
    });
    return initial;
  });

  // ---- Image handling ----

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ---- Analysis ----

  const runAnalysis = useCallback(() => {
    if (!imageFile && !adCopy.trim()) return;
    setIsAnalyzing(true);
    // Simulate API call delay
    setTimeout(() => {
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  }, [imageFile, adCopy]);

  // ---- Focus group chat ----

  const sendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setChatMessages((prev) => ({
      ...prev,
      [activePersona]: [...(prev[activePersona] || []), userMsg],
    }));
    setChatInput('');

    // Simulate persona response
    setTimeout(() => {
      const responses = personaMockResponses[activePersona] || [];
      const responseText = responses[Math.floor(Math.random() * responses.length)];

      const personaMsg: ChatMessage = {
        id: `persona-${Date.now()}`,
        role: 'persona',
        content: responseText,
        timestamp: new Date(),
      };

      setChatMessages((prev) => ({
        ...prev,
        [activePersona]: [...(prev[activePersona] || []), personaMsg],
      }));
    }, 1200);
  }, [chatInput, activePersona]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // ---- Render helpers ----

  const currentPersona = personas.find((p) => p.id === activePersona)!;
  const currentMessages = chatMessages[activePersona] || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Studio</h1>
        <p className="text-gray-500 mt-1">
          Analysera och kvalitetssäkra annonser med AI innan publicering
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================ */}
        {/* LEFT COLUMN – Upload & Input                                     */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Image upload */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ladda upp annons</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-[#0000A0] bg-blue-50/60'
                    : imagePreview
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 hover:border-[#0000A0]/50 bg-gray-50/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Annonsförhandsvisning"
                      className="w-full rounded-xl object-contain max-h-[400px]"
                    />
                    {/* Heatmap overlay */}
                    {showHeatmap && analysis && (
                      <HeatmapOverlay points={analysis.heatmapData} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                      <Upload className="w-7 h-7 text-[#0000A0]" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Dra och släpp din annonsbild här
                    </p>
                    <p className="text-xs text-gray-500">
                      eller klicka för att välja fil (PNG, JPG, WebP)
                    </p>
                  </div>
                )}
              </div>

              {imageFile && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="truncate">{imageFile.name}</span>
                  <span>({(imageFile.size / 1024).toFixed(0)} KB)</span>
                  <button
                    className="ml-auto text-[#DC3545] hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                      setAnalysis(null);
                      setShowHeatmap(false);
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ad copy input */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Annonstext</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Klistra in din annonstext här..."
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                className="min-h-[120px] resize-y"
              />
            </CardContent>
          </Card>

          {/* Analyse button */}
          <Button
            className="w-full h-12 text-base font-semibold bg-[#0000A0] hover:bg-[#000080] text-white"
            onClick={runAnalysis}
            disabled={isAnalyzing || (!imageFile && !adCopy.trim())}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyserar...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Kör AI-analys
              </>
            )}
          </Button>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN – Results (shown after analysis)                    */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {!analysis && !isAnalyzing && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Ladda upp en annons och kör AI-analys
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Resultaten visas här efter analysen
                </p>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 border-3 border-[#0000A0]/20 border-t-[#0000A0] rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-700">Analyserar din annons...</p>
                <p className="text-xs text-gray-500 mt-1">
                  Brand fit, performance och compliance kontrolleras
                </p>
              </CardContent>
            </Card>
          )}

          {analysis && !isAnalyzing && (
            <>
              {/* Score rings */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Resultat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-around">
                    <ScoreRing score={analysis.brandFit} label="Brand Fit" />
                    <ScoreRing score={analysis.performance} label="Performance" />
                    <ScoreRing score={analysis.compliance} label="Compliance" />
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap toggle */}
              {imagePreview && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-[#0000A0]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Eye-tracking heatmap
                        </p>
                        <p className="text-xs text-gray-500">
                          Simulerad uppmärksamhetsanalys
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={showHeatmap ? 'default' : 'outline'}
                      size="sm"
                      className={showHeatmap ? 'bg-[#0000A0] hover:bg-[#000080]' : ''}
                      onClick={() => setShowHeatmap(!showHeatmap)}
                    >
                      {showHeatmap ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Dölj
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Visa
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Compliance checklist */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Compliance-checklista</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.complianceItems.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          item.status === 'pass'
                            ? 'bg-green-50/60'
                            : item.status === 'warning'
                              ? 'bg-yellow-50/60'
                              : 'bg-red-50/60'
                        }`}
                      >
                        <ComplianceIcon status={item.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{item.message}</p>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-[10px] ${
                              item.status === 'pass'
                                ? 'border-[#00A76F]/30 text-[#00A76F]'
                                : item.status === 'warning'
                                  ? 'border-[#F59E0B]/30 text-[#F59E0B]'
                                  : 'border-[#DC3545]/30 text-[#DC3545]'
                            }`}
                          >
                            {item.status === 'pass'
                              ? 'Godkänd'
                              : item.status === 'warning'
                                ? 'Varning'
                                : 'Underkänd'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI suggestions */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                    AI-förslag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/40"
                      >
                        <div className="mt-0.5">
                          <Badge
                            className={`text-[10px] ${
                              suggestion.priority === 'high'
                                ? 'bg-[#DC3545]/10 text-[#DC3545] border-[#DC3545]/20'
                                : suggestion.priority === 'medium'
                                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                            variant="outline"
                          >
                            {suggestion.priority === 'high'
                              ? 'Hög'
                              : suggestion.priority === 'medium'
                                ? 'Medel'
                                : 'Låg'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 flex-1">{suggestion.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Virtual Focus Group */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#0000A0]" />
                    Virtual Focus Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activePersona}
                    onValueChange={setActivePersona}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-4 mb-4">
                      {personas.map((persona) => (
                        <TabsTrigger
                          key={persona.id}
                          value={persona.id}
                          className="text-xs gap-1 px-1"
                        >
                          <span className="hidden sm:inline">{persona.avatar}</span>
                          <span className="truncate">{persona.name.split(' ')[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {personas.map((persona) => (
                      <TabsContent key={persona.id} value={persona.id}>
                        {/* Persona header */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50">
                          <span className="text-2xl">{persona.avatar}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{persona.name}</p>
                            <p className="text-xs text-gray-500">
                              {persona.responseStyle === 'curious'
                                ? 'Nyfiken och ifrågasättande'
                                : persona.responseStyle === 'skeptical'
                                  ? 'Skeptisk och trygghetssökande'
                                  : 'Neutral och jämförande'}
                            </p>
                          </div>
                        </div>

                        {/* Chat messages */}
                        <ScrollArea className="h-[300px] pr-2">
                          <div className="space-y-3">
                            {chatMessages[persona.id]?.length === 0 && (
                              <div className="text-center py-10">
                                <p className="text-xs text-gray-400">
                                  Ställ en fråga till {persona.name} om annonsen
                                </p>
                              </div>
                            )}

                            {chatMessages[persona.id]?.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${
                                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                    msg.role === 'user'
                                      ? 'bg-[#0000A0] text-white rounded-br-md'
                                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                  }`}
                                >
                                  {msg.role === 'persona' && (
                                    <span className="text-xs font-medium text-gray-500 block mb-1">
                                      {persona.avatar} {persona.name}
                                    </span>
                                  )}
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {/* Chat input */}
                        <div className="flex items-center gap-2 mt-4">
                          <Input
                            placeholder={`Fråga ${persona.name}...`}
                            value={activePersona === persona.id ? chatInput : ''}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleChatKeyDown}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            className="bg-[#0000A0] hover:bg-[#000080] shrink-0"
                            onClick={sendMessage}
                            disabled={!chatInput.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
