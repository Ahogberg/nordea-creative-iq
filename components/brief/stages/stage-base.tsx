"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { AIThinkingOverlay } from "../ai-thinking-overlay";

// Reusable co-creation pattern for every wizard stage.
// The pattern: user writes their answer → after ~1.5s of stable text the
// stage triggers an AI suggestion fetch in the background → AI proposes
// alternatives the user can append (not overwrite). User stays in control.
interface AIAssistanceConfig<T = unknown> {
  enabled: boolean;
  label?: string;
  fetchSuggestions: (
    context: Record<string, unknown>,
    currentAnswer: string
  ) => Promise<T>;
  renderSuggestions?: (
    suggestions: T,
    onSelect: (s: string) => void
  ) => React.ReactNode;
}

interface StageBaseProps {
  title: string;
  description: string;
  question: string;
  placeholder: string;
  context: Record<string, unknown>;
  answer: string;
  onComplete: (answer: string, aiOutputs?: unknown) => void;
  onBack?: () => void;
  aiAssistance?: AIAssistanceConfig;
}

export function StageBase({
  title,
  description,
  question,
  placeholder,
  context,
  answer: initialAnswer,
  onComplete,
  onBack,
  aiAssistance,
}: StageBaseProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [suggestions, setSuggestions] = useState<unknown>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const hasAutoFetchedRef = useRef(false);

  const fetchAISuggestions = async () => {
    if (!aiAssistance?.enabled) return;
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const data = await aiAssistance.fetchSuggestions(context, answer);
      setSuggestions(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI-förslag misslyckades");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Auto-trigger AI once the user has settled on a meaningful answer.
  // Only fires once per stage entry — re-triggering is on manual button.
  useEffect(() => {
    if (
      aiAssistance?.enabled &&
      answer.length > 30 &&
      !suggestions &&
      !isLoadingAI &&
      !hasAutoFetchedRef.current
    ) {
      const timer = setTimeout(() => {
        hasAutoFetchedRef.current = true;
        fetchAISuggestions();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [answer]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-nordea-text tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-base text-nordea-text-secondary">{description}</p>
      </div>

      <div>
        <label className="block text-base font-medium text-nordea-text mb-3">
          {question}
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-white border border-nordea-border rounded-xl text-base text-nordea-text placeholder:text-nordea-text-tertiary focus:outline-none focus:border-nordea-blue/40 focus:ring-2 focus:ring-nordea-blue/10 resize-none"
        />
      </div>

      {aiAssistance?.enabled && answer.length > 30 && (
        <div className="bg-nordea-teal/5 border border-nordea-teal/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-nordea-teal" />
            <span className="text-sm font-medium text-nordea-text">
              {aiAssistance.label || "AI-förslag"}
            </span>
            {isLoadingAI && (
              <Loader2 className="w-4 h-4 animate-spin text-nordea-text-tertiary ml-auto" />
            )}
          </div>

          {aiError && (
            <p className="text-xs text-nordea-rose mb-2">{aiError}</p>
          )}

          {suggestions !== null && aiAssistance.renderSuggestions && (
            <>
              {aiAssistance.renderSuggestions(suggestions, (selected) => {
                setAnswer((prev) => (prev ? `${prev}\n\n${selected}` : selected));
              })}
              <AIThinkingOverlay
                thinking={
                  (suggestions as { thinking?: string } | null)?.thinking
                }
                show={true}
              />
              <button
                type="button"
                onClick={fetchAISuggestions}
                disabled={isLoadingAI}
                className="text-xs text-nordea-teal hover:underline mt-3"
              >
                Hämta nya förslag
              </button>
            </>
          )}

          {suggestions === null && !isLoadingAI && (
            <button
              type="button"
              onClick={fetchAISuggestions}
              className="text-sm text-nordea-teal hover:underline"
            >
              Hämta AI-förslag
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => onComplete(answer, suggestions)}
          disabled={answer.trim().length < 10}
          className="nordea-btn nordea-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Nästa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
