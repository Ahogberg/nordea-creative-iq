"use client";

import { StageBase } from "./stage-base";

interface Props {
  context: Record<string, unknown>;
  answer: string;
  onComplete: (answer: string, ai?: unknown) => void;
  onBack: () => void;
}

interface MessageSuggestions {
  key_messages?: Array<{
    angle: string;
    headline: string;
    rationale: string;
  }>;
}

export function MessageStage({ context, answer, onComplete, onBack }: Props) {
  return (
    <StageBase
      title="Vad vill du säga?"
      description="Hitta kärnan i budskapet. AI:n föreslår 3 alternativa vinklar."
      question="Vad är det viktigaste budskapet?"
      placeholder='T.ex. "Hos Nordea får du räntor som inte överraskar och en rådgivare som går igenom siffrorna med dig."'
      context={context}
      answer={answer}
      onComplete={onComplete}
      onBack={onBack}
      aiAssistance={{
        enabled: true,
        label: "Tre vinklar att välja mellan",
        fetchSuggestions: async (ctx, currentAnswer) => {
          const res = await fetch("/api/brief/ai-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "message",
              context: ctx,
              currentAnswer,
            }),
          });
          if (!res.ok) throw new Error("Kunde inte föreslå vinklar");
          return res.json();
        },
        renderSuggestions: (data, onSelect) => {
          const typed = data as MessageSuggestions;
          return (
            <div className="space-y-2">
              {typed.key_messages?.map((msg, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() =>
                    onSelect(
                      `${msg.angle}: "${msg.headline}" — ${msg.rationale}`
                    )
                  }
                  className="block text-left bg-white p-3 rounded-md border border-nordea-border hover:border-nordea-teal/40 w-full transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-nordea-teal uppercase tracking-wider">
                      {msg.angle}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-nordea-text mb-1">
                    &ldquo;{msg.headline}&rdquo;
                  </p>
                  <p className="text-xs text-nordea-text-tertiary">
                    {msg.rationale}
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
