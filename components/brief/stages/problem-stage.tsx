"use client";

import { StageBase } from "./stage-base";

interface Props {
  answer: string;
  onComplete: (answer: string, ai?: unknown) => void;
}

interface ProblemSuggestions {
  insights?: string[];
}

export function ProblemStage({ answer, onComplete }: Props) {
  return (
    <StageBase
      title="Vad är utmaningen?"
      description="Beskriv problemet du vill lösa, möjligheten du vill ta vara på, eller situationen som kräver kommunikation."
      question="Vad händer just nu som gör att du behöver kommunicera?"
      placeholder='T.ex. "Räntan har stigit och förstagångsköpare blir mer försiktiga. Vi behöver visa att Nordea har stabila villkor."'
      context={{}}
      answer={answer}
      onComplete={onComplete}
      aiAssistance={{
        enabled: true,
        label: "Insikter från liknande utmaningar",
        fetchSuggestions: async (context, currentAnswer) => {
          const res = await fetch("/api/brief/ai-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "problem",
              context,
              currentAnswer,
            }),
          });
          if (!res.ok) throw new Error("Kunde inte hämta förslag");
          return res.json();
        },
        renderSuggestions: (data, onSelect) => {
          const typed = data as ProblemSuggestions;
          return (
            <div className="space-y-2">
              {typed.insights?.map((insight, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => onSelect(insight)}
                  className="block text-left text-sm text-nordea-text-secondary hover:text-nordea-text hover:bg-white p-2 rounded-md w-full transition-colors"
                >
                  💡 {insight}
                </button>
              ))}
            </div>
          );
        },
      }}
    />
  );
}
