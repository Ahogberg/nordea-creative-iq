'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Send } from 'lucide-react';

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
    { status: 'warning', category: 'disclaimer', message: 'Riskdisclaimer saknas f\u00f6r investeringsprodukt' },
    { status: 'pass', category: 'terminology', message: 'Korrekt terminologi anv\u00e4nds' },
    { status: 'fail', category: 'legal', message: 'Effektiv r\u00e4nta m\u00e5ste anges tydligare' },
  ],
  suggestions: [
    { type: 'visual', priority: 'high', message: '\u00d6ka kontrasten p\u00e5 CTA-knappen f\u00f6r b\u00e4ttre synlighet' },
    { type: 'copy', priority: 'medium', message: 'F\u00f6renkla rubriken \u2013 anv\u00e4nd max 8 ord f\u00f6r LinkedIn' },
    { type: 'compliance', priority: 'high', message: 'L\u00e4gg till riskdisclaimer: "Historisk avkastning \u00e4r ingen garanti..."' },
    { type: 'performance', priority: 'medium', message: 'Placera CTA ovanf\u00f6r folden f\u00f6r b\u00e4ttre konvertering' },
  ],
};

const personas: PersonaTab[] = [
  { id: 'young', name: 'Ung F\u00f6rstagångsk\u00f6pare', avatar: '', responseStyle: 'curious' },
  { id: 'saver', name: 'Spararen', avatar: '', responseStyle: 'neutral' },
  { id: 'parent', name: 'Familje\u00f6r\u00e4ldern', avatar: '', responseStyle: 'neutral' },
  { id: 'retiree', name: 'Pensionsspararen', avatar: '', responseStyle: 'skeptical' },
];

const personaMockResponses: Record<string, string[]> = {
  young: [
    'Hmm, annonsens rubrik \u00e4r ganska catchy, men jag vill veta mer om de faktiska kostnaderna. Vad \u00e4r den effektiva r\u00e4ntan? Det st\u00e5r inte tydligt nog.',
    'Jag gillar att designen \u00e4r ren och modern, men det k\u00e4nns lite som "typisk bank". Hade velat se mer transparens \u2013 visa mig reella siffror, inte bara "f\u00f6rm\u00e5nlig r\u00e4nta".',
    'CTA:n "Ans\u00f6k nu" ger mig lite panik. Kan ni inte ha n\u00e5got mjukare, typ "R\u00e4kna p\u00e5 ditt bol\u00e5n" s\u00e5 jag kan utforska f\u00f6rst utan att committa?',
    'Appen ser snygg ut i bilden, men funkar den verkligen s\u00e5 smidigt? Jag har laddat ner massa bank-appar som inte levde upp till l\u00f6ftet.',
    'Det saknas info om vad som h\u00e4nder efter att jag klickar. Blir jag uppringd? F\u00e5r jag ett mail? Jag vill veta processen innan jag ger ifr\u00e5n mig mina uppgifter.',
  ],
  saver: [
    'Jag f\u00f6rst\u00e5r att ni vill locka med avkastning, men var \u00e4r j\u00e4mf\u00f6relsen? Hur st\u00e5r sig era fonder mot Avanza eller Lysa? Visa mig siffror.',
    'Avgifterna n\u00e4mns inte alls i annonsen. Det \u00e4r det f\u00f6rsta jag kollar. Utan den infon scrollar jag bara vidare.',
    'Designen \u00e4r lugn och professionell, det gillar jag. Men budskapet \u00e4r f\u00f6r vagt \u2013 "L\u00e5t pengarna v\u00e4xa" s\u00e4ger ingenting konkret.',
    'Hade uppskattat en enkel kalkyl direkt i annonsen. Typ: "Spara 2 000 kr/m\u00e5n i 10 \u00e5r = X kr med Y% avkastning".',
    'Disclaimern beh\u00f6ver finnas med. Jag ser direkt att den saknas och d\u00e5 tappar jag f\u00f6rtroende f\u00f6r hela annonsen.',
  ],
  parent: [
    'Snabb tanke: jag ser inte direkt vad erbjudandet \u00e4r. Jag har typ 5 sekunder innan barnen kr\u00e4ver uppm\u00e4rksamhet, s\u00e5 budskapet m\u00e5ste vara kristallklart.',
    'Barnperspektivet saknas helt. Visa mig att ni f\u00f6rst\u00e5r att jag sparar f\u00f6r DERAS skull, inte bara min egen. Det hade gjort att jag stannade kvar.',
    'Bra att det finns en tydlig knapp, men kan ni l\u00e4gga till "Tar 2 minuter" eller liknande? Jag beh\u00f6ver veta att det inte stj\u00e4l min kv\u00e4ll.',
    'Designen k\u00e4nns vuxen och seri\u00f6s \u2013 bra. Men kanske lite f\u00f6r stel? En touch v\u00e4rme, en familj-bild eller liknande, hade gjort stor skillnad.',
    'Finns det en "automatisk"-funktion? Typ att jag s\u00e4tter ig\u00e5ng ett m\u00e5nadssparande och sen sk\u00f6ter sig allt? Lyft det i annonsen isf.',
  ],
  retiree: [
    'Texten \u00e4r f\u00f6r liten f\u00f6r mig. Om jag beh\u00f6ver zooma in f\u00f6r att l\u00e4sa villkoren s\u00e5 st\u00e4nger jag sidan direkt. Och var \u00e4r telefonnumret?',
    'Jag vill inte klicka p\u00e5 "Ans\u00f6k nu" utan att f\u00f6rst prata med n\u00e5gon. Finns det ingen m\u00f6jlighet att boka ett m\u00f6te ist\u00e4llet? Det borde st\u00e5 i annonsen.',
    'Ni skriver "digital r\u00e5dgivning" \u2013 men vad inneb\u00e4r det egentligen? \u00c4r det en chatbot? Jag vill prata med en riktig m\u00e4nniska som f\u00f6rst\u00e5r min situation.',
    'Annonsen ser professionell ut, det ska ni ha. Men jag saknar trygghetsk\u00e4nslan. Visa mig att mina pengar \u00e4r s\u00e4kra, det \u00e4r det enda jag bryr mig om nu.',
    'Pensionssystemet \u00e4r redan f\u00f6rvirrande nog. F\u00f6renkla budskapet. Ber\u00e4tta f\u00f6r mig vad jag BEH\u00d6VER g\u00f6ra, inte alla alternativ som finns.',
  ],
};

// ---------------------------------------------------------------------------
// Score bar component - plain number with thin progress bar
// ---------------------------------------------------------------------------

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-lg font-semibold text-gray-900">{score}</span>
      </div>
      <div className="w-full h-[2px] bg-gray-100 rounded-sm">
        <div
          className="h-full rounded-sm transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
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
            <span className="mt-1 text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded-sm">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance text symbol helper
// ---------------------------------------------------------------------------

function ComplianceSymbol({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  if (status === 'pass')
    return <span className="text-sm font-medium text-green-600 w-5 text-center shrink-0">&#10003;</span>;
  if (status === 'warning')
    return <span className="text-sm font-medium text-amber-600 w-5 text-center shrink-0">!</span>;
  return <span className="text-sm font-medium text-red-600 w-5 text-center shrink-0">&times;</span>;
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
        <h1 className="text-xl font-semibold text-gray-900">Ad Studio</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analysera och kvalitetss\u00e4kra annonser med AI innan publicering
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================ */}
        {/* LEFT COLUMN - Upload & Input                                     */}
        {/* ================================================================ */}
        <div className="space-y-5">
          {/* Image upload */}
          <div className="bg-white border border-gray-200 rounded-md shadow-none">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Ladda upp annons</h2>
            </div>
            <div className="p-5">
              <div
                className={`relative border border-dashed rounded-md transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-gray-400 bg-white'
                    : imagePreview
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
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
                      alt="Annonsef\u00f6rhandsvisning"
                      className="w-full rounded-md object-contain max-h-[400px]"
                    />
                    {/* Heatmap overlay */}
                    {showHeatmap && analysis && (
                      <HeatmapOverlay points={analysis.heatmapData} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 px-4">
                    <p className="text-sm text-gray-400">
                      Sl\u00e4pp fil h\u00e4r eller klicka
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      PNG, JPG, WebP
                    </p>
                  </div>
                )}
              </div>

              {imageFile && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="truncate">{imageFile.name}</span>
                  <span>({(imageFile.size / 1024).toFixed(0)} KB)</span>
                  <button
                    className="ml-auto text-red-600 hover:underline text-xs"
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
            </div>
          </div>

          {/* Ad copy input */}
          <div className="bg-white border border-gray-200 rounded-md shadow-none">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Annonstext</h2>
            </div>
            <div className="p-5">
              <Textarea
                placeholder="Klistra in din annonstext h\u00e4r..."
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                className="min-h-[120px] resize-y border-gray-200 shadow-none rounded-md"
              />
            </div>
          </div>

          {/* Analyse button */}
          <Button
            className="w-full h-11 text-sm font-medium bg-[#0000A0] hover:bg-[#000080] text-white shadow-none rounded-md"
            onClick={runAnalysis}
            disabled={isAnalyzing || (!imageFile && !adCopy.trim())}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyserar...
              </>
            ) : (
              'Analysera'
            )}
          </Button>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN - Results (shown after analysis)                    */}
        {/* ================================================================ */}
        <div className="space-y-5">
          {!analysis && !isAnalyzing && (
            <div className="bg-white border border-gray-200 rounded-md shadow-none">
              <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
                <p className="text-sm text-gray-400">
                  Ladda upp en annons och k\u00f6r AI-analys
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Resultaten visas h\u00e4r efter analysen
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-white border border-gray-200 rounded-md shadow-none">
              <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-600">Analyserar din annons...</p>
                <p className="text-xs text-gray-400 mt-1">
                  Brand fit, performance och compliance kontrolleras
                </p>
              </div>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <>
              {/* Score bars */}
              <div className="bg-white border border-gray-200 rounded-md shadow-none">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-900">Resultat</h2>
                </div>
                <div className="p-5">
                  <div className="flex gap-6">
                    <ScoreBar score={analysis.brandFit} label="Brand Fit" />
                    <ScoreBar score={analysis.performance} label="Performance" />
                    <ScoreBar score={analysis.compliance} label="Compliance" />
                  </div>
                </div>
              </div>

              {/* Heatmap toggle */}
              {imagePreview && (
                <div className="bg-white border border-gray-200 rounded-md shadow-none">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-600">Eye-tracking heatmap</span>
                    <Switch
                      checked={showHeatmap}
                      onCheckedChange={setShowHeatmap}
                    />
                  </div>
                </div>
              )}

              {/* Compliance checklist */}
              <div className="bg-white border border-gray-200 rounded-md shadow-none">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-900">Compliance</h2>
                </div>
                <div className="px-5 py-3">
                  <ul className="space-y-0">
                    {analysis.complianceItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-b-0"
                      >
                        <ComplianceSymbol status={item.status} />
                        <span className="text-sm text-gray-700 flex-1">{item.message}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {item.status === 'pass'
                            ? 'Godk\u00e4nd'
                            : item.status === 'warning'
                              ? 'Varning'
                              : 'Underk\u00e4nd'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI suggestions */}
              <div className="bg-white border border-gray-200 rounded-md shadow-none">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-900">F\u00f6rslag</h2>
                </div>
                <div className="px-5 py-3">
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 py-1">
                        <span className="text-gray-300 mt-0.5 text-xs leading-5">&#8226;</span>
                        <span className="text-sm text-gray-700 flex-1">{suggestion.message}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {suggestion.priority === 'high'
                            ? 'H\u00f6g'
                            : suggestion.priority === 'medium'
                              ? 'Medel'
                              : 'L\u00e5g'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Virtual Focus Group */}
              <div className="bg-white border border-gray-200 rounded-md shadow-none">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-900">Virtual Focus Group</h2>
                </div>
                <div className="px-5 py-4">
                  {/* Persona tabs - plain text with underline */}
                  <div className="flex gap-4 border-b border-gray-100 mb-4">
                    {personas.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => setActivePersona(persona.id)}
                        className={`pb-2 text-xs font-medium transition-colors relative ${
                          activePersona === persona.id
                            ? 'text-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {persona.name.split(' ')[0]}
                        {activePersona === persona.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-900" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Persona description */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400">
                      {currentPersona.name} -{' '}
                      {currentPersona.responseStyle === 'curious'
                        ? 'Nyfiken och ifr\u00e5gas\u00e4ttande'
                        : currentPersona.responseStyle === 'skeptical'
                          ? 'Skeptisk och trygghetsökande'
                          : 'Neutral och j\u00e4mf\u00f6rande'}
                    </p>
                  </div>

                  {/* Chat messages */}
                  <div className="h-[280px] overflow-y-auto space-y-2 mb-3">
                    {currentMessages.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-xs text-gray-300">
                          St\u00e4ll en fr\u00e5ga till {currentPersona.name} om annonsen
                        </p>
                      </div>
                    )}

                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 text-sm rounded-md ${
                            msg.role === 'user'
                              ? 'bg-white border border-gray-200 text-gray-800'
                              : 'bg-[#FAFAFA] text-gray-700'
                          }`}
                        >
                          {msg.role === 'persona' && (
                            <span className="text-xs text-gray-400 block mb-0.5">
                              {currentPersona.name}
                            </span>
                          )}
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat input */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Fr\u00e5ga ${currentPersona.name}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      className="flex-1 border-gray-200 shadow-none rounded-md text-sm"
                    />
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      onClick={sendMessage}
                      disabled={!chatInput.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
