"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Play, RefreshCw, Eye, MessageSquareWarning, TrendingUp, TrendingDown } from "lucide-react";
import { PersonaImage } from "@/components/ui/persona-image";
import { findPersona } from "@/lib/persona-library";
import type { ProductCategory } from "@/lib/product-detection";

export interface FocusGroupPersona {
  id: string;
  name: string;
  description?: string | null;
  traits: string[];
  pain_points: string[];
  goals?: string[];
  age_min?: number | null;
  age_max?: number | null;
  digital_maturity?: string;
  system_prompt?: string | null;
  response_style: string;
}

export interface FocusGroupContext {
  copy: { headline: string; body: string; cta: string };
  channel: string;
  images: string[];
  isVideo: boolean;
  productCategory?: ProductCategory;
}

interface Reaction {
  firstImpression: string;
  wouldClick: number;
  objections: string[];
  firstNoticed?: string | null;
  sawVisual?: boolean;
}

type Slot = { status: "idle" } | { status: "thinking" } | { status: "done"; reaction: Reaction } | { status: "error" };

interface FocusGroupPanelProps {
  personas: FocusGroupPersona[];
  getContext: () => Promise<FocusGroupContext>;
  disabled?: boolean;
  /** Öka värdet för att starta fokusgruppen utifrån (t.ex. vid "Analysera"). */
  runSignal?: number;
}

const MIN_REVEAL_GAP_MS = 260;

/**
 * Virtual Focus Group: alla personas tittar på annonsen samtidigt och
 * reaktionerna dyker upp allteftersom de kommer in.
 */
export function FocusGroupPanel({ personas, getContext, disabled, runSignal }: FocusGroupPanelProps) {
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [running, setRunning] = useState(false);
  const lastSignal = useRef(runSignal);

  const run = async () => {
    if (running || personas.length === 0) return;
    setRunning(true);
    setSlots(Object.fromEntries(personas.map((p) => [p.id, { status: "thinking" } as Slot])));
    const ctx = await getContext();

    let revealAt = Date.now();
    await Promise.all(
      personas.map(async (p) => {
        let slot: Slot;
        try {
          const res = await fetch("/api/persona-react", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personaName: p.name,
              personaDescription: p.description,
              personaTraits: p.traits,
              personaPainPoints: p.pain_points,
              personaGoals: p.goals,
              personaAge: p.age_min ? { min: p.age_min, max: p.age_max ?? p.age_min + 10 } : undefined,
              personaDigitalMaturity: p.digital_maturity,
              personaSystemPrompt: p.system_prompt,
              responseStyle: p.response_style,
              ...ctx,
            }),
          });
          const data = await res.json();
          slot = {
            status: "done",
            reaction: {
              firstImpression: data.firstImpression ?? "",
              wouldClick: typeof data.wouldClick === "number" ? data.wouldClick : 50,
              objections: Array.isArray(data.objections) ? data.objections : [],
              firstNoticed: data.firstNoticed ?? null,
              sawVisual: data.sawVisual === true,
            },
          };
        } catch {
          slot = { status: "error" };
        }
        // Svaren visas ett i taget, även om de kommer samtidigt.
        revealAt = Math.max(revealAt + MIN_REVEAL_GAP_MS, Date.now());
        const wait = revealAt - Date.now();
        await new Promise((r) => setTimeout(r, wait));
        setSlots((prev) => ({ ...prev, [p.id]: slot }));
      })
    );
    setRunning(false);
  };

  useEffect(() => {
    if (runSignal === undefined || runSignal === lastSignal.current) return;
    lastSignal.current = runSignal;
    void run();
    // run() läser senaste props via closure; signalen är enda triggern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSignal]);

  const done = personas
    .map((p) => ({ p, slot: slots[p.id] }))
    .filter((x): x is { p: FocusGroupPersona; slot: { status: "done"; reaction: Reaction } } => x.slot?.status === "done");
  const allDone = done.length === personas.length && personas.length > 0;
  const avg = done.length > 0 ? Math.round(done.reduce((s, x) => s + x.slot.reaction.wouldClick, 0) / done.length) : 0;
  const clickers = done.filter((x) => x.slot.reaction.wouldClick >= 50).length;
  const sorted = [...done].sort((a, b) => b.slot.reaction.wouldClick - a.slot.reaction.wouldClick);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const hasRun = Object.keys(slots).length > 0;

  return (
    <div className="nordea-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-nordea-hairline">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-nordea-blue-soft text-nordea-blue flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-nordea-text">Fokusgrupp</h3>
            <p className="text-xs text-nordea-text-tertiary">
              {personas.length} simulerade kunder tittar på annonsen samtidigt
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={disabled || running || personas.length === 0}
          className="nordea-btn nordea-btn-cobalt disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hasRun ? <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} /> : <Play className="w-4 h-4" />}
          {running ? "Personorna tittar…" : hasRun ? "Kör igen" : "Kör fokusgrupp"}
        </button>
      </div>

      {hasRun && (
        <div
          className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-6 items-center px-5 py-4 bg-gradient-to-r from-nordea-blue-soft to-transparent transition-opacity duration-500 ${
            done.length > 0 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span className="nordea-display text-4xl text-nordea-deep tabular-nums">{avg}%</span>
            <span className="text-xs text-nordea-text-tertiary">snitt klickvilja</span>
          </div>
          <div className="text-sm text-nordea-text">
            <span className="font-semibold tabular-nums">{clickers} av {personas.length}</span> skulle troligen klicka
            {!allDone && <span className="text-nordea-text-tertiary"> · {done.length}/{personas.length} har svarat</span>}
          </div>
          {allDone && best && worst && best !== worst && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1 text-nordea-green">
                <TrendingUp className="w-3.5 h-3.5" /> Starkast: {displayName(best.p)}
              </span>
              <span className="inline-flex items-center gap-1 text-nordea-rose">
                <TrendingDown className="w-3.5 h-3.5" /> Svagast: {displayName(worst.p)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-nordea-hairline">
        {personas.map((p) => (
          <PersonaSlot key={p.id} persona={p} slot={slots[p.id] ?? { status: "idle" }} />
        ))}
      </div>
    </div>
  );
}

function displayName(p: FocusGroupPersona) {
  return findPersona(p.name)?.name.split(" ")[0] ?? p.name;
}

function PersonaSlot({ persona, slot }: { persona: FocusGroupPersona; slot: Slot }) {
  const profile = findPersona(persona.name);
  const name = profile?.name ?? persona.name;

  return (
    <div className="bg-white p-4 min-h-[190px] flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`relative rounded-xl ${slot.status === "thinking" ? "animate-pulse" : ""}`}>
          {slot.status === "thinking" && (
            <span className="absolute -inset-1 rounded-[14px] ring-2 ring-nordea-teal/60 animate-ping" />
          )}
          <PersonaImage name={name} color={profile?.color ?? "from-nordea-blue to-nordea-deep"} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-nordea-text truncate">{name}</div>
          <div className="text-[11px] text-nordea-text-tertiary truncate">{persona.name}</div>
        </div>
        {slot.status === "done" && (
          <div className="text-right animate-in fade-in zoom-in-90 duration-500">
            <div className={`text-xl font-semibold tabular-nums ${clickTone(slot.reaction.wouldClick)}`}>
              {slot.reaction.wouldClick}%
            </div>
            <div className="text-[10px] text-nordea-text-tertiary -mt-0.5">klickar</div>
          </div>
        )}
      </div>

      {slot.status === "idle" && (
        <p className="text-xs text-nordea-text-faint mt-auto mb-auto">Väntar på att fokusgruppen startar</p>
      )}

      {slot.status === "thinking" && (
        <div className="space-y-2 mt-1">
          <p className="text-xs text-nordea-text-tertiary">Tittar på annonsen…</p>
          <div className="h-2.5 rounded bg-nordea-blue-soft w-11/12 animate-pulse" />
          <div className="h-2.5 rounded bg-nordea-blue-soft w-9/12 animate-pulse [animation-delay:150ms]" />
          <div className="h-2.5 rounded bg-nordea-blue-soft w-7/12 animate-pulse [animation-delay:300ms]" />
        </div>
      )}

      {slot.status === "error" && <p className="text-xs text-nordea-rose">Kunde inte få en reaktion.</p>}

      {slot.status === "done" && (
        <div className="flex flex-col gap-2.5 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="h-1.5 rounded-full bg-nordea-blue-soft overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: `${slot.reaction.wouldClick}%`, backgroundColor: clickColor(slot.reaction.wouldClick) }}
            />
          </div>
          <p className="text-[12.5px] text-nordea-text leading-relaxed line-clamp-4">&ldquo;{slot.reaction.firstImpression}&rdquo;</p>
          <div className="mt-auto flex flex-col gap-1.5">
            {slot.reaction.firstNoticed && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-nordea-text-secondary">
                <Eye className="w-3 h-3 text-nordea-teal shrink-0" /> Såg först: {slot.reaction.firstNoticed}
              </span>
            )}
            {slot.reaction.objections[0] && (
              <span className="inline-flex items-start gap-1.5 text-[11px] text-nordea-text-secondary">
                <MessageSquareWarning className="w-3 h-3 text-nordea-amber shrink-0 mt-px" /> {slot.reaction.objections[0]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function clickColor(v: number) {
  return v >= 60 ? "var(--nordea-teal)" : v >= 40 ? "var(--nordea-amber)" : "var(--nordea-rose)";
}

function clickTone(v: number) {
  return v >= 60 ? "text-nordea-green" : v >= 40 ? "text-nordea-amber" : "text-nordea-rose";
}
