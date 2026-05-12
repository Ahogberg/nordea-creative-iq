"use client";

import { StageBase } from "./stage-base";

interface Props {
  context: Record<string, unknown>;
  answer: string;
  onComplete: (answer: string, ai?: unknown) => void;
  onBack: () => void;
}

interface PerceptionSuggestions {
  insight?: string;
  tension?: string;
}

export function PerceptionStage({
  context,
  answer,
  onComplete,
  onBack,
}: Props) {
  return (
    <StageBase
      title="Vad tänker de redan?"
      description="Förstå målgruppens nuvarande mindset. Det är ofta här insikter bor."
      question="Hur upplever målgruppen situationen idag?"
      placeholder='T.ex. "De känner att alla banker höjer ständigt och att det är omöjligt att veta vilka villkor man kan lita på."'
      context={context}
      answer={answer}
      onComplete={onComplete}
      onBack={onBack}
      aiAssistance={{
        enabled: true,
        label: "Insight-detektion",
        fetchSuggestions: async (ctx, currentAnswer) => {
          const res = await fetch("/api/brief/ai-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "perception",
              context: ctx,
              currentAnswer,
            }),
          });
          if (!res.ok) throw new Error("Kunde inte detektera insikter");
          return res.json();
        },
        renderSuggestions: (data, onSelect) => {
          const typed = data as PerceptionSuggestions;
          return (
            <div className="space-y-2">
              {typed.insight && (
                <button
                  type="button"
                  onClick={() => onSelect(`Insikt: ${typed.insight}`)}
                  className="block text-left bg-white p-3 rounded-md border border-nordea-teal/30 w-full hover:bg-nordea-bg-hover transition-colors"
                >
                  <p className="text-xs font-medium text-nordea-teal mb-1 uppercase tracking-wider">
                    Insikt
                  </p>
                  <p className="text-sm text-nordea-text">{typed.insight}</p>
                </button>
              )}
              {typed.tension && (
                <button
                  type="button"
                  onClick={() => onSelect(`Spänning: ${typed.tension}`)}
                  className="block text-left bg-white p-3 rounded-md border border-nordea-amber/30 w-full hover:bg-nordea-bg-hover transition-colors"
                >
                  <p className="text-xs font-medium text-nordea-amber mb-1 uppercase tracking-wider">
                    Spänning
                  </p>
                  <p className="text-sm text-nordea-text">{typed.tension}</p>
                </button>
              )}
            </div>
          );
        },
      }}
    />
  );
}
