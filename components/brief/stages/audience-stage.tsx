"use client";

import { StageBase } from "./stage-base";

interface Props {
  context: Record<string, unknown>;
  answer: string;
  onComplete: (answer: string, ai?: unknown) => void;
  onBack: () => void;
}

interface AudienceSuggestions {
  personas?: Array<{
    id: string;
    name: string;
    match: number;
    rationale: string;
  }>;
}

export function AudienceStage({ context, answer, onComplete, onBack }: Props) {
  return (
    <StageBase
      title="Vem talar du till?"
      description="Beskriv målgruppen. AI:n mappar din beskrivning mot Nordeas befintliga personor."
      question="Vem är din primära målgrupp?"
      placeholder='T.ex. "Förstagångsköpare 28-35 år i Stockholm/Göteborg som funderar på sitt första bostadsköp men är osäkra på räntan."'
      context={context}
      answer={answer}
      onComplete={onComplete}
      onBack={onBack}
      aiAssistance={{
        enabled: true,
        label: "Persona-matchning",
        fetchSuggestions: async (ctx, currentAnswer) => {
          const res = await fetch("/api/brief/ai-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "audience",
              context: ctx,
              currentAnswer,
            }),
          });
          if (!res.ok) throw new Error("Kunde inte matcha personor");
          return res.json();
        },
        renderSuggestions: (data, onSelect) => {
          const typed = data as AudienceSuggestions;
          return (
            <div className="space-y-2">
              <p className="text-xs text-nordea-text-tertiary mb-2">
                AI matchar mot dessa personor:
              </p>
              {typed.personas?.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    onSelect(`${p.name}: ${p.rationale}`)
                  }
                  className="block text-left bg-white p-3 rounded-md border border-nordea-border hover:border-nordea-teal/40 w-full transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-nordea-text">
                      {p.name}
                    </span>
                    <span className="text-xs font-mono text-nordea-teal">
                      {p.match}% match
                    </span>
                  </div>
                  <p className="text-xs text-nordea-text-tertiary">
                    {p.rationale}
                  </p>
                </button>
              ))}
            </div>
          );
        },
      }}
    />
  );
}
