"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Rocket,
  AlertCircle,
} from "lucide-react";
import type { KeyMessage, ValueProp, Kpi } from "@/lib/brief/types";

interface Strategy {
  big_idea?: string;
  insight?: string;
  tension?: string;
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

export function ReviewStage({ briefId, answers, onApprove, onBack }: Props) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(false);

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

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-nordea-blue animate-spin mb-4" />
        <p className="text-base font-medium text-nordea-text mb-1">
          Bygger strategin…
        </p>
        <p className="text-sm text-nordea-text-tertiary text-center max-w-sm">
          AI sammanställer insight, key messages, value props och rekommendationer
        </p>
      </div>
    );
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-nordea-text tracking-tight mb-2">
          Din strategi är klar
        </h1>
        <p className="text-base text-nordea-text-secondary">
          Granska och justera innan vi genererar kampanjmaterial
        </p>
      </div>

      {/* Big idea */}
      <div className="bg-white border border-nordea-border rounded-xl p-6">
        <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-3">
          The Big Idea
        </h3>
        <p className="text-xl font-semibold text-nordea-text mb-4">
          {strategy.big_idea}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-nordea-hairline">
          {strategy.insight && (
            <div>
              <h4 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-1">
                Insight
              </h4>
              <p className="text-sm text-nordea-text">{strategy.insight}</p>
            </div>
          )}
          {strategy.tension && (
            <div>
              <h4 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-1">
                Tension
              </h4>
              <p className="text-sm text-nordea-text">{strategy.tension}</p>
            </div>
          )}
        </div>
      </div>

      {/* Key messages */}
      {strategy.key_messages && strategy.key_messages.length > 0 && (
        <div className="bg-white border border-nordea-border rounded-xl p-6">
          <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-4">
            Budskap-vinklar ({strategy.key_messages.length})
          </h3>
          <div className="space-y-3">
            {strategy.key_messages.map((msg, i) => (
              <div key={i} className="bg-nordea-bg-hover rounded-lg p-4">
                <span className="text-xs font-medium text-nordea-teal uppercase tracking-wider">
                  {msg.angle}
                </span>
                <p className="text-base font-medium text-nordea-text mt-1 mb-1">
                  &ldquo;{msg.headline}&rdquo;
                </p>
                <p className="text-xs text-nordea-text-tertiary">
                  {msg.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value props */}
      {strategy.value_props && strategy.value_props.length > 0 && (
        <div className="bg-white border border-nordea-border rounded-xl p-6">
          <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-4">
            Value Props ({strategy.value_props.length})
          </h3>
          <div className="space-y-2">
            {strategy.value_props.map((vp, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    vp.importance === "primary"
                      ? "text-nordea-teal"
                      : "text-nordea-text-tertiary"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-nordea-text">
                    {vp.prop}
                  </p>
                  <p className="text-xs text-nordea-text-tertiary">
                    {vp.evidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tone */}
      {strategy.tone_of_voice && (
        <div className="bg-white border border-nordea-border rounded-xl p-6">
          <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-3">
            Tone of Voice
          </h3>
          <p className="text-sm text-nordea-text leading-relaxed">
            {strategy.tone_of_voice}
          </p>
        </div>
      )}

      {/* Formats + Channels */}
      <div className="grid sm:grid-cols-2 gap-4">
        {strategy.recommended_formats &&
          strategy.recommended_formats.length > 0 && (
            <div className="bg-white border border-nordea-border rounded-xl p-6">
              <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-3">
                Rekommenderade format
              </h3>
              <div className="flex gap-1.5 flex-wrap">
                {strategy.recommended_formats.map((f) => (
                  <span
                    key={f}
                    className="text-xs font-medium px-2.5 py-1 bg-nordea-bg-hover rounded-md text-nordea-text"
                  >
                    {FORMAT_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          )}

        {strategy.recommended_channels &&
          strategy.recommended_channels.length > 0 && (
            <div className="bg-white border border-nordea-border rounded-xl p-6">
              <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-3">
                Kanaler
              </h3>
              <div className="flex gap-1.5 flex-wrap">
                {strategy.recommended_channels.map((c) => (
                  <span
                    key={c}
                    className="text-xs font-medium px-2.5 py-1 bg-nordea-bg-hover rounded-md text-nordea-text"
                  >
                    {CHANNEL_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* KPIs */}
      {strategy.recommended_kpis && strategy.recommended_kpis.length > 0 && (
        <div className="bg-white border border-nordea-border rounded-xl p-6">
          <h3 className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-4">
            KPIs ({strategy.recommended_kpis.length})
          </h3>
          <div className="space-y-2">
            {strategy.recommended_kpis.map((kpi, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-3 py-2 border-b border-nordea-hairline last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nordea-text">
                    {kpi.metric}
                  </p>
                  <p className="text-xs text-nordea-text-tertiary">
                    {kpi.measurement}
                  </p>
                </div>
                <span className="text-sm font-mono text-nordea-teal flex-shrink-0">
                  {kpi.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka och justera
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
  );
}
