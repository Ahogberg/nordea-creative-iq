'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PersonaAvatar, CountUp } from '@/components/ui/nordea';
import { Users, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import type { ProductCategory } from '@/lib/product-detection';

// ---------------------------------------------------------------------------
// VirtualFocusGroup — kör hela personapanelen parallellt mot /api/persona-react
// och visar varje kort när dess svar landar, som en live-fokusgrupp.
// ---------------------------------------------------------------------------

export interface FocusGroupPersona {
  id: string;
  name: string;
  traits: string[];
  pain_points: string[];
  system_prompt: string | null;
  response_style: string;
  age_min?: number;
  age_max?: number;
  description?: string;
  digital_maturity?: string;
}

interface FocusGroupProps {
  personas: FocusGroupPersona[];
  copy: { headline: string; body: string; cta: string };
  channel: string;
  isVideo: boolean;
  productCategory: ProductCategory;
}

interface PanelReaction {
  firstImpression: string;
  wouldClick: number;
  objections: string[];
  whatWorked?: string | null;
  suggestion?: string | null;
}

type PanelState =
  | { status: 'thinking' }
  | { status: 'done'; reaction: PanelReaction }
  | { status: 'error' };

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center py-1" aria-label="Skriver…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#0000A0]/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function VirtualFocusGroup({ personas, copy, channel, isVideo, productCategory }: FocusGroupProps) {
  const [panel, setPanel] = useState<Record<string, PanelState>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runGroup = async () => {
    if (personas.length === 0) return;
    setIsRunning(true);
    setHasRun(true);
    const initial: Record<string, PanelState> = {};
    for (const p of personas) initial[p.id] = { status: 'thinking' };
    setPanel(initial);

    await Promise.allSettled(
      personas.map(async (p) => {
        // Jitter så mock-läget (fast serverfördröjning) ändå känns som en livepanel
        const jitter = 600 + Math.floor(Math.random() * 1400);
        const [res] = await Promise.all([
          fetch('/api/persona-react', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personaName: p.name,
              personaDescription: p.description,
              personaTraits: p.traits,
              personaPainPoints: p.pain_points,
              personaAge: p.age_min ? { min: p.age_min, max: p.age_max || p.age_min + 10 } : undefined,
              personaDigitalMaturity: p.digital_maturity,
              personaSystemPrompt: p.system_prompt,
              responseStyle: p.response_style,
              copy,
              channel,
              isVideo,
              productCategory,
            }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
            .catch(() => null),
          new Promise((r) => setTimeout(r, jitter)),
        ]);

        setPanel((prev) => ({
          ...prev,
          [p.id]: res
            ? {
                status: 'done',
                reaction: {
                  firstImpression: res.firstImpression || 'Intressant annons.',
                  wouldClick: typeof res.wouldClick === 'number' ? res.wouldClick : 50,
                  objections: Array.isArray(res.objections) ? res.objections : [],
                  whatWorked: res.whatWorked,
                  suggestion: res.suggestion,
                },
              }
            : { status: 'error' },
        }));
      })
    );
    setIsRunning(false);
  };

  const doneReactions = personas
    .map((p) => panel[p.id])
    .filter((s): s is Extract<PanelState, { status: 'done' }> => s?.status === 'done')
    .map((s) => s.reaction);

  const allSettled =
    hasRun && personas.every((p) => panel[p.id] && panel[p.id].status !== 'thinking');
  const avgClick =
    doneReactions.length > 0
      ? Math.round(doneReactions.reduce((sum, r) => sum + r.wouldClick, 0) / doneReactions.length)
      : 0;
  const positiveCount = doneReactions.filter((r) => r.wouldClick >= 60).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0000A0]" />
          <h3 className="font-medium text-gray-900">Virtuell fokusgrupp</h3>
        </div>
        <Button
          onClick={runGroup}
          disabled={isRunning || personas.length === 0}
          size="sm"
          className="bg-[#0000A0] hover:bg-[#00005E]"
        >
          {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isRunning ? 'Panelen tittar…' : hasRun ? 'Kör igen' : 'Kör fokusgrupp'}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {personas.length} personas reagerar samtidigt på annonsen
      </p>

      {/* Verdict banner */}
      {allSettled && doneReactions.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="text-center shrink-0">
            <CountUp value={avgClick} suffix=" %" className="text-3xl font-semibold text-[#0000A0]" />
            <p className="text-[11px] text-gray-500">skulle klicka</p>
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-medium text-gray-900">Panelens dom</p>
            <p>
              {positiveCount} av {doneReactions.length} personas är positiva
              {avgClick >= 70 ? ' — stark annons för målgruppen.' : avgClick >= 50 ? ' — fungerar, men kan vässas.' : ' — annonsen behöver omarbetas.'}
            </p>
          </div>
        </div>
      )}

      {/* Panel cards */}
      {hasRun && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personas.map((p) => {
            const state = panel[p.id];
            return (
              <div key={p.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <PersonaAvatar name={p.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {p.age_min && (
                      <p className="text-[11px] text-gray-400">{p.age_min}–{p.age_max} år</p>
                    )}
                  </div>
                  {state?.status === 'done' && (
                    <span
                      className={`ml-auto shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        state.reaction.wouldClick >= 60
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {state.reaction.wouldClick >= 60 ? (
                        <ThumbsUp className="w-3 h-3" />
                      ) : (
                        <ThumbsDown className="w-3 h-3" />
                      )}
                      {state.reaction.wouldClick} %
                    </span>
                  )}
                </div>

                {(!state || state.status === 'thinking') && <TypingDots />}

                {state?.status === 'done' && (
                  <div className="animate-in fade-in duration-500 space-y-2">
                    <p className="text-sm text-gray-700 italic">&quot;{state.reaction.firstImpression}&quot;</p>
                    {state.reaction.objections.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Främsta invändning: {state.reaction.objections[0]}
                      </p>
                    )}
                  </div>
                )}

                {state?.status === 'error' && (
                  <p className="text-xs text-gray-400">Kunde inte hämta reaktion.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
