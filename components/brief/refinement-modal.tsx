"use client";

import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";

interface Props {
  field: string;
  currentValue: unknown;
  briefContext: unknown;
  onAccept: (newValue: unknown) => void;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  big_idea: "The Big Idea",
  insight: "Insight",
  tension: "Tension",
  key_messages: "Budskap-vinklar",
  value_props: "Value Props",
  tone_of_voice: "Tone of Voice",
};

function renderValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return JSON.stringify(v, null, 2);
}

export function RefinementModal({
  field,
  currentValue,
  briefContext,
  onAccept,
  onClose,
}: Props) {
  const [instruction, setInstruction] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [suggestion, setSuggestion] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const requestRefinement = async () => {
    setIsThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/brief/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          currentValue,
          briefContext,
          instruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI failed");
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsThinking(false);
    }
  };

  const label = FIELD_LABELS[field] ?? field;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordea-deep/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-nordea-hairline">
          <div>
            <h2 className="text-lg font-semibold text-nordea-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-nordea-teal" />
              Justera med AI
            </h2>
            <p className="text-xs text-nordea-text-tertiary mt-0.5">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-nordea-bg-hover"
          >
            <X className="w-4 h-4 text-nordea-text-tertiary" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="text-xs font-medium text-nordea-text-tertiary uppercase tracking-wider mb-2">
              Nuvarande
            </div>
            <div className="bg-nordea-bg-hover rounded-lg p-3 text-sm text-nordea-text max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
              {renderValue(currentValue)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-nordea-text mb-2">
              Vad vill du justera?
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='T.ex. "Gör det mer emotionellt", "Kortare", "Fokus på trygghet istället för pris"'
              rows={3}
              className="w-full nordea-input"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-xs text-nordea-rose bg-nordea-rose-soft rounded-lg p-3">
              {error}
            </div>
          )}

          {suggestion !== null && suggestion !== undefined && (
            <div>
              <div className="text-xs font-medium text-nordea-teal uppercase tracking-wider mb-2">
                AI:s förslag
              </div>
              <div className="bg-nordea-teal/5 border border-nordea-teal/20 rounded-lg p-3 text-sm text-nordea-text max-h-48 overflow-y-auto whitespace-pre-wrap">
                {renderValue(suggestion)}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-nordea-hairline">
          <button
            type="button"
            onClick={onClose}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          >
            Avbryt
          </button>
          {suggestion === null || suggestion === undefined ? (
            <button
              type="button"
              onClick={requestRefinement}
              disabled={!instruction.trim() || isThinking}
              className="nordea-btn nordea-btn-primary nordea-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isThinking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Be AI om förslag
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSuggestion(null)}
                className="nordea-btn nordea-btn-secondary nordea-btn-sm"
              >
                Försök igen
              </button>
              <button
                type="button"
                onClick={() => {
                  onAccept(suggestion);
                  onClose();
                }}
                className="nordea-btn nordea-btn-primary nordea-btn-sm"
              >
                Använd förslaget
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
