"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Rocket,
  AlertCircle,
  Edit3,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import type { KeyMessage, ValueProp, Kpi } from "@/lib/brief/types";
import { defaultPersonas } from "@/lib/constants/personas";

interface Strategy {
  big_idea?: string;
  insight?: string;
  tension?: string;
  audience_personas?: string[];
  key_messages?: KeyMessage[];
  value_props?: ValueProp[];
  tone_of_voice?: string;
  recommended_formats?: string[];
  recommended_channels?: string[];
  recommended_kpis?: Kpi[];
}

interface Props {
  briefId: string;
  answers: Record<string, unknown>;
  onApprove: () => void;
  onBack: () => void;
  // Om briefen redan har en sparad strategi — hoppa över synthesis-kallet
  // och visa direkt. Används från /create/brief/[id] för att inte
  // re-generera (och kosta pengar) vid varje load.
  initialStrategy?: Strategy;
}

const FORMAT_LABELS: Record<string, string> = {
  story: "Story · 9:16",
  feed: "Feed · 1:1",
  landscape: "Landscape · 16:9",
  vertical: "Vertical · 4:5",
};

const CHANNEL_LABELS: Record<string, string> = {
  meta: "Meta",
  linkedin: "LinkedIn",
  google: "Google Ads",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const SYNTHESIS_STEPS = [
  "Analyserar din input…",
  "Bygger insight…",
  "Identifierar tension…",
  "Skapar key messages…",
  "Definierar value props…",
  "Sammanställer strategi…",
];

function personaSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o");
}

export function ReviewStage({
  briefId,
  answers,
  onApprove,
  onBack,
  initialStrategy,
}: Props) {
  const [strategy, setStrategy] = useState<Strategy | null>(
    initialStrategy ?? null
  );
  const [isGenerating, setIsGenerating] = useState(!initialStrategy);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(!!initialStrategy);

  const generateStrategy = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/brief/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Synthesis failed");
      }
      const data = await res.json();
      setStrategy(data.strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    generateStrategy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save edited fields back to the brief in supabase. Optimistic UI:
  // state updates omedelbart, persist i bakgrunden.
  const saveField = async (field: keyof Strategy, value: unknown) => {
    setStrategy((prev) => (prev ? { ...prev, [field]: value } : prev));
    try {
      await fetch(`/api/brief/${briefId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error("[review-stage] persist failed", err);
    }
  };

  if (isGenerating) {
    return <SynthesisLoader />;
  }

  if (error || !strategy) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-nordea-rose mx-auto mb-3" />
        <p className="text-base font-medium text-nordea-text mb-2">
          Kunde inte generera strategi
        </p>
        {error && (
          <p className="text-sm text-nordea-text-tertiary mb-4">{error}</p>
        )}
        <button
          type="button"
          onClick={generateStrategy}
          className="nordea-btn nordea-btn-primary"
        >
          Försök igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Hero: Big Idea */}
      <div className="bg-gradient-to-br from-nordea-deep via-nordea-blue to-nordea-blue text-white rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-nordea-teal/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="relative">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-3 font-medium">
            The Big Idea
          </div>
          <EditableHeroText
            value={strategy.big_idea ?? ""}
            onSave={(v) => saveField("big_idea", v)}
          />
        </div>
      </div>

      {/* Insight + Tension */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card label="Insight" emoji="💡" color="teal">
          <EditableText
            value={strategy.insight ?? ""}
            onSave={(v) => saveField("insight", v)}
          />
        </Card>
        <Card label="Tension" emoji="⚡" color="amber">
          <EditableText
            value={strategy.tension ?? ""}
            onSave={(v) => saveField("tension", v)}
          />
        </Card>
      </div>

      {/* Personas */}
      {strategy.audience_personas && strategy.audience_personas.length > 0 && (
        <Section
          title="Personas vi pratar till"
          hint={`${strategy.audience_personas.length} valda`}
        >
          <div className="grid md:grid-cols-2 gap-3">
            {strategy.audience_personas.map((personaId: string) => {
              const p = defaultPersonas.find(
                (d) => personaSlug(d.name) === personaId
              );
              if (!p) return null;
              return (
                <div
                  key={personaId}
                  className="bg-white border border-nordea-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-nordea-teal to-nordea-blue rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {p.avatar ?? p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-nordea-text">
                        {p.name}
                      </div>
                      <div className="text-xs text-nordea-text-tertiary mb-2">
                        {p.age_min}–{p.age_max} år · {p.life_stage}
                      </div>
                      <p className="text-xs text-nordea-text-secondary leading-relaxed line-clamp-2">
                        {p.pain_points?.[0]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Key messages — Creative Cards */}
      {strategy.key_messages && strategy.key_messages.length > 0 && (
        <Section
          title="Budskap-vinklar"
          hint={`${strategy.key_messages.length} koncept`}
        >
          <div className="space-y-3">
            {strategy.key_messages.map((msg, i) => (
              <MessageCard
                key={i}
                message={msg}
                index={i}
                onUpdate={(updated) => {
                  const next = [...(strategy.key_messages ?? [])];
                  next[i] = updated;
                  saveField("key_messages", next);
                }}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Value Props */}
      {strategy.value_props && strategy.value_props.length > 0 && (
        <Section
          title="Value Props"
          hint={`${strategy.value_props.length} bevis`}
        >
          <div className="space-y-2">
            {strategy.value_props.map((vp, i) => (
              <ValuePropRow key={i} valueProp={vp} />
            ))}
          </div>
        </Section>
      )}

      {/* Tone + Formats */}
      <div className="grid md:grid-cols-2 gap-4">
        {strategy.tone_of_voice && (
          <Card label="Tone of Voice" emoji="🎙">
            <EditableText
              value={strategy.tone_of_voice}
              onSave={(v) => saveField("tone_of_voice", v)}
            />
          </Card>
        )}
        {strategy.recommended_formats &&
          strategy.recommended_formats.length > 0 && (
            <Card label="Rekommenderade format" emoji="📐">
              <div className="flex gap-2 flex-wrap">
                {strategy.recommended_formats.map((f) => (
                  <span
                    key={f}
                    className="nordea-format-chip nordea-format-chip-active"
                  >
                    {FORMAT_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </Card>
          )}
      </div>

      {/* Channels */}
      {strategy.recommended_channels &&
        strategy.recommended_channels.length > 0 && (
          <Card label="Kanaler" emoji="📡">
            <div className="flex gap-2 flex-wrap">
              {strategy.recommended_channels.map((c) => (
                <span
                  key={c}
                  className="text-xs font-medium px-2.5 py-1 bg-nordea-bg-hover rounded-md text-nordea-text"
                >
                  {CHANNEL_LABELS[c] ?? c}
                </span>
              ))}
            </div>
          </Card>
        )}

      {/* KPIs */}
      {strategy.recommended_kpis && strategy.recommended_kpis.length > 0 && (
        <Section title="KPIer att mäta" hint="Så vet vi att det funkar">
          <div className="grid md:grid-cols-3 gap-3">
            {strategy.recommended_kpis.map((kpi, i) => (
              <div
                key={i}
                className="bg-white border border-nordea-border rounded-xl p-4"
              >
                <div className="text-xs text-nordea-text-tertiary mb-1 uppercase tracking-wider">
                  {kpi.metric}
                </div>
                <div className="text-xl font-semibold text-nordea-text mb-1">
                  {kpi.target}
                </div>
                <div className="text-xs text-nordea-text-secondary">
                  {kpi.measurement}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-8 pb-12">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generateStrategy}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generera om
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="nordea-btn nordea-btn-primary nordea-btn-lg"
          >
            <Rocket className="w-4 h-4" />
            Generera kampanj
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Synthesis loader ───────────────────────────────────────────────────
function SynthesisLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, SYNTHESIS_STEPS.length - 1));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nordea-blue/10 to-nordea-teal/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-nordea-blue animate-spin" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-nordea-text mb-2">
        Bygger din strategi
      </h2>

      <div className="h-6 text-center">
        <p className="text-sm text-nordea-text-secondary transition-opacity">
          {SYNTHESIS_STEPS[step]}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-6">
        {SYNTHESIS_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i <= step ? "bg-nordea-teal" : "bg-nordea-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────────────
function Card({
  label,
  emoji,
  color = "default",
  children,
}: {
  label: string;
  emoji?: string;
  color?: "default" | "teal" | "amber";
  children: React.ReactNode;
}) {
  const colorClasses = {
    default: "bg-white border-nordea-border",
    teal: "bg-nordea-teal/5 border-nordea-teal/20",
    amber: "bg-nordea-amber-soft border-nordea-amber/20",
  };

  return (
    <div className={`border rounded-2xl p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        {emoji && <span className="text-base">{emoji}</span>}
        <span className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold text-nordea-text">{title}</h2>
          {hint && (
            <span className="text-xs text-nordea-text-tertiary">{hint}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const GRADIENT_VARIANTS = [
  "from-nordea-blue/5 to-nordea-blue/10",
  "from-nordea-teal/5 to-nordea-teal/10",
  "from-nordea-amber-soft to-nordea-amber-soft",
];

function MessageCard({
  message,
  index,
  onUpdate,
}: {
  message: KeyMessage;
  index: number;
  onUpdate: (next: KeyMessage) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<KeyMessage>(message);

  if (editing) {
    return (
      <div className="bg-white border-2 border-nordea-blue/30 rounded-2xl p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-1">
            Vinkel
          </label>
          <input
            value={draft.angle}
            onChange={(e) => setDraft({ ...draft, angle: e.target.value })}
            className="w-full nordea-input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-1">
            Headline
          </label>
          <textarea
            value={draft.headline}
            onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            rows={2}
            className="w-full nordea-input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-1">
            Rationale
          </label>
          <textarea
            value={draft.rationale}
            onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
            rows={2}
            className="w-full nordea-input"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setDraft(message);
              setEditing(false);
            }}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          >
            <X className="w-3 h-3" />
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdate(draft);
              setEditing(false);
            }}
            className="nordea-btn nordea-btn-primary nordea-btn-sm"
          >
            <Save className="w-3 h-3" />
            Spara
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${
        GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]
      } border border-nordea-border rounded-2xl p-5 group relative cursor-pointer hover:border-nordea-blue/30 transition-colors`}
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-nordea-teal uppercase tracking-wider">
          Vinkel {index + 1}: {message.angle}
        </span>
        <Edit3 className="w-3.5 h-3.5 text-nordea-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-xl font-semibold text-nordea-text mb-2 leading-tight">
        &ldquo;{message.headline}&rdquo;
      </h3>
      <p className="text-xs text-nordea-text-tertiary italic border-t border-nordea-hairline pt-3 mt-3">
        {message.rationale}
      </p>
    </div>
  );
}

function ValuePropRow({ valueProp }: { valueProp: ValueProp }) {
  return (
    <div className="flex items-start gap-3 bg-white border border-nordea-border rounded-lg p-3">
      <CheckCircle2
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
          valueProp.importance === "primary"
            ? "text-nordea-teal"
            : "text-nordea-text-tertiary"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-nordea-text">{valueProp.prop}</p>
        <p className="text-xs text-nordea-text-tertiary mt-0.5">
          {valueProp.evidence}
        </p>
      </div>
      {valueProp.importance === "primary" && (
        <span className="nordea-badge nordea-badge-teal">Primary</span>
      )}
    </div>
  );
}

function EditableText({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          className="w-full nordea-input text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="nordea-btn nordea-btn-primary nordea-btn-sm"
          >
            <Save className="w-3 h-3" />
            Spara
          </button>
        </div>
      </div>
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="text-sm text-nordea-text leading-relaxed cursor-text hover:bg-nordea-bg-hover -mx-2 px-2 py-1 rounded-md transition-colors"
      title="Klicka för att redigera"
    >
      {value || (
        <span className="text-nordea-text-tertiary italic">
          Klicka för att lägga till…
        </span>
      )}
    </p>
  );
}

function EditableHeroText({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          className="w-full bg-white/10 text-white text-2xl font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/40 placeholder:text-white/40"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="text-xs text-white/70 hover:text-white px-2 py-1 rounded-md hover:bg-white/10"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="text-xs text-nordea-deep bg-white hover:bg-white/90 px-3 py-1 rounded-md font-medium flex items-center gap-1"
          >
            <Save className="w-3 h-3" />
            Spara
          </button>
        </div>
      </div>
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="text-3xl md:text-4xl font-semibold leading-tight cursor-text hover:bg-white/10 -mx-2 px-2 rounded-lg transition-colors group"
      title="Klicka för att redigera"
    >
      {value}
      <Edit3 className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-60 transition-opacity" />
    </h1>
  );
}
