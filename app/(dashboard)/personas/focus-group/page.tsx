'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PERSONA_LIBRARY, type PersonaProfile } from '@/lib/persona-library';
import { PersonaImage } from '@/components/ui/persona-image';
import { PersonaReactionCard, type PersonaReactionData } from '@/components/personas/PersonaReactionCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Users, Play, RotateCcw, MessageCircle, ChevronRight,
  TrendingUp, ArrowLeft, CheckCircle2, Circle,
} from 'lucide-react';

type ResultState = 'loading' | 'done' | 'error';

interface PersonaResult {
  state: ResultState;
  data?: PersonaReactionData;
}

interface AdInput {
  headline: string;
  body: string;
  cta: string;
  channel: string;
  imageDescription: string;
}

const CHANNELS = [
  { value: 'social_feed', label: 'Social Feed (Meta / LinkedIn)' },
  { value: 'display', label: 'Display' },
  { value: 'email', label: 'E-post' },
  { value: 'landing_page', label: 'Landningssida' },
  { value: 'video', label: 'Video / Pre-roll' },
  { value: 'outdoor', label: 'Utomhus / OOH' },
];

const EMPTY_AD: AdInput = {
  headline: '', body: '', cta: '', channel: 'social_feed', imageDescription: '',
};

export default function FocusGroupPage() {
  const [adInput, setAdInput] = useState<AdInput>(EMPTY_AD);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, PersonaResult>>({});
  const [running, setRunning] = useState(false);
  const [chatPersona, setChatPersona] = useState<PersonaProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'persona'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const hasResults = Object.keys(results).length > 0;
  const selectedPersonas = PERSONA_LIBRARY.filter(p => selectedIds.has(p.id));
  const canRun = adInput.headline.trim().length > 0 && selectedIds.size > 0 && !running;

  const togglePersona = (id: string) => {
    if (running) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setResults({});
    setAdInput(EMPTY_AD);
    setSelectedIds(new Set());
  };

  const runFocusGroup = useCallback(async () => {
    if (!canRun) return;
    setRunning(true);

    const init: Record<string, PersonaResult> = {};
    selectedPersonas.forEach(p => { init[p.id] = { state: 'loading' }; });
    setResults(init);

    await Promise.allSettled(
      selectedPersonas.map(async (persona) => {
        try {
          const res = await fetch('/api/persona-react', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personaName: persona.name,
              personaSystemPrompt: persona.systemPrompt,
              personaTraits: persona.traits,
              personaPainPoints: persona.painPoints,
              personaAge: persona.age,
              personaDigitalMaturity: persona.digitalMaturity,
              personaDescription: persona.description,
              responseStyle: persona.responseStyle,
              copy: {
                headline: adInput.headline,
                body: adInput.body,
                cta: adInput.cta,
              },
              channel: adInput.channel,
              imageDescription: adInput.imageDescription || undefined,
            }),
          });
          const data = await res.json();
          setResults(prev => ({ ...prev, [persona.id]: { state: 'done', data } }));
        } catch {
          setResults(prev => ({ ...prev, [persona.id]: { state: 'error' } }));
        }
      })
    );

    setRunning(false);
  }, [canRun, selectedPersonas, adInput]);

  const openChat = (persona: PersonaProfile) => {
    const reaction = results[persona.id]?.data;
    setChatPersona(persona);
    setChatMessages([{
      role: 'persona',
      content: reaction?.firstImpression
        ? `${reaction.firstImpression}`
        : `Hej! Jag är ${persona.name}. Vad vill du veta om annonsen?`,
    }]);
    setChatInput('');
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !chatPersona || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'persona' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await fetch('/api/persona-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: chatPersona.name,
          personaSystemPrompt: chatPersona.systemPrompt,
          personaTraits: chatPersona.traits,
          personaPainPoints: chatPersona.painPoints,
          personaAge: chatPersona.age,
          responseStyle: chatPersona.responseStyle,
          adContext: {
            headline: adInput.headline,
            body: adInput.body,
            cta: adInput.cta,
            channel: adInput.channel,
          },
          messages: history,
          newMessage: userMessage,
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'persona', content: data.reply || 'Hmm...' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'persona', content: 'Något gick fel. Försök igen.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const doneResults = Object.values(results).filter(r => r.state === 'done' && r.data);
  const avgClick = doneResults.length
    ? Math.round(doneResults.reduce((sum, r) => sum + (r.data?.wouldClick ?? 0), 0) / doneResults.length)
    : null;
  const avgRelevance = doneResults.length
    ? Math.round(doneResults.reduce((sum, r) => sum + (r.data?.relevance?.score ?? 0), 0) / doneResults.length)
    : null;
  const positiveCount = doneResults.filter(r => (r.data?.wouldClick ?? 0) >= 60).length;
  const allDone = hasResults && !running && doneResults.length === selectedPersonas.length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Link href="/personas" className="hover:text-nordea-blue flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Personas
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Fokusgrupp</h1>
          <p className="text-gray-600">Testa din annons eller idé mot flera personas simultaneously</p>
        </div>
        {hasResults && (
          <button onClick={reset} className="btn-secondary gap-2">
            <RotateCcw className="w-4 h-4" /> Nytt test
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Left panel: inputs ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1: Ad copy */}
          <div className="glass-card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-nordea-blue text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
              Din annons / idé
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rubrik <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={adInput.headline}
                  onChange={e => setAdInput(p => ({ ...p, headline: e.target.value }))}
                  placeholder="T.ex. Lånelöfte på 10 minuter"
                  className="glass-input"
                  disabled={running}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Brödtext</label>
                <textarea
                  value={adInput.body}
                  onChange={e => setAdInput(p => ({ ...p, body: e.target.value }))}
                  placeholder="Kompletterande text i annonsen..."
                  className="glass-input resize-none"
                  rows={3}
                  disabled={running}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">CTA</label>
                  <input
                    type="text"
                    value={adInput.cta}
                    onChange={e => setAdInput(p => ({ ...p, cta: e.target.value }))}
                    placeholder="Ansök nu"
                    className="glass-input"
                    disabled={running}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Kanal</label>
                  <Select
                    value={adInput.channel}
                    onValueChange={v => setAdInput(p => ({ ...p, channel: v }))}
                    disabled={running}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Bild / konceptbeskrivning <span className="text-gray-400">(valfri)</span></label>
                <textarea
                  value={adInput.imageDescription}
                  onChange={e => setAdInput(p => ({ ...p, imageDescription: e.target.value }))}
                  placeholder="Beskriv bild, video eller konceptet om det är relevant för tolkningen…"
                  className="glass-input resize-none"
                  rows={2}
                  disabled={running}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Persona selection */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-nordea-blue text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                Välj personas
                {selectedIds.size > 0 && (
                  <span className="text-xs bg-nordea-blue text-white px-2 py-0.5 rounded-full font-medium">
                    {selectedIds.size}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => !running && setSelectedIds(new Set(PERSONA_LIBRARY.map(p => p.id)))}
                  className="text-nordea-blue hover:underline disabled:opacity-40"
                  disabled={running}
                >
                  Välj alla
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => !running && setSelectedIds(new Set())}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  disabled={running}
                >
                  Rensa
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {PERSONA_LIBRARY.map(persona => {
                const selected = selectedIds.has(persona.id);
                const done = results[persona.id]?.state === 'done';
                const loading = results[persona.id]?.state === 'loading';
                return (
                  <button
                    key={persona.id}
                    onClick={() => togglePersona(persona.id)}
                    disabled={running}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-nordea-blue bg-blue-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                      selected ? 'border-nordea-blue bg-nordea-blue' : 'border-gray-300 bg-white'
                    }`}>
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <PersonaImage name={persona.name} color={persona.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{persona.name}</p>
                      <p className="text-xs text-gray-500">{persona.shortName} · {persona.age.min}–{persona.age.max} år</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-nordea-blue animate-spin shrink-0" />}
                    {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runFocusGroup}
            disabled={!canRun}
            className="btn-primary w-full text-base py-3.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Kör fokusgrupp…</>
            ) : (
              <><Play className="w-5 h-5" /> Kör fokusgrupp</>
            )}
          </button>
        </div>

        {/* ── Right panel: results ── */}
        <div className="lg:col-span-3">
          {!hasResults ? (
            <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Redo att testa</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Fyll i din annons, välj vilka personas du vill testa mot och klicka på "Kör fokusgrupp".
              </p>
              <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Alla reaktioner är statistiskt kalibrerade mot SCB 2023
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              {allDone && avgClick !== null && (
                <div className="glass-card mb-5 flex flex-wrap items-center gap-6 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-nordea-blue" />
                    <span className="text-sm font-semibold text-gray-900">Sammanfattning</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Klickbenägenhet (snitt)</p>
                      <p className={`text-2xl font-bold leading-none ${
                        avgClick >= 60 ? 'text-emerald-600' : avgClick >= 40 ? 'text-amber-600' : 'text-red-500'
                      }`}>{avgClick}%</p>
                    </div>
                    {avgRelevance !== null && avgRelevance > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Relevans (snitt)</p>
                        <p className={`text-2xl font-bold leading-none ${
                          avgRelevance >= 60 ? 'text-emerald-600' : avgRelevance >= 40 ? 'text-amber-600' : 'text-red-500'
                        }`}>{avgRelevance}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Positiva reaktioner</p>
                      <p className="text-2xl font-bold text-gray-900 leading-none">
                        {positiveCount}
                        <span className="text-sm font-normal text-gray-400 ml-1">/ {doneResults.length}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPersonas.map((persona) => {
                  const result = results[persona.id];

                  if (!result || result.state === 'loading') {
                    return (
                      <PersonaReactionCard
                        key={persona.id}
                        personaName={persona.name}
                        personaColor={persona.color}
                        reaction={{} as PersonaReactionData}
                        isLoading
                      />
                    );
                  }

                  if (result.state === 'error' || !result.data) {
                    return (
                      <div key={persona.id} className="glass-card flex items-center gap-3 py-5">
                        <PersonaImage name={persona.name} color={persona.color} size="md" />
                        <div>
                          <p className="font-medium text-gray-900">{persona.name}</p>
                          <p className="text-sm text-red-500 mt-0.5">Kunde inte hämta reaktion — försök igen</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={persona.id} className="space-y-2">
                      <PersonaReactionCard
                        personaName={persona.name}
                        personaColor={persona.color}
                        reaction={result.data}
                      />
                      <button
                        onClick={() => openChat(persona)}
                        className="btn-secondary w-full text-sm py-2 gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chatta vidare med {persona.name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat modal */}
      <Dialog open={!!chatPersona} onOpenChange={open => { if (!open) setChatPersona(null); }}>
        <DialogContent className="max-w-lg">
          {chatPersona && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-3">
                    <PersonaImage name={chatPersona.name} color={chatPersona.color} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{chatPersona.name}</p>
                      <p className="text-xs text-gray-500 font-normal mt-0.5">
                        {chatPersona.shortName} · reagerar på &quot;{adInput.headline}&quot;
                      </p>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="h-72 overflow-y-auto custom-scrollbar space-y-3 py-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>{msg.content}</div>
                ))}
                {chatLoading && (
                  <div className="chat-message persona">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-nordea-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-nordea-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-nordea-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !chatLoading && handleChatSend()}
                  placeholder={`Fråga ${chatPersona.name.split(' ')[0]}…`}
                  className="chat-input flex-1"
                  disabled={chatLoading}
                  autoFocus
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="chat-send-btn"
                >
                  {chatLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
