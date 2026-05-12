"use client";

import { StageBase } from "./stage-base";

interface Props {
  context: Record<string, unknown>;
  answer: string;
  onComplete: (answer: string, ai?: unknown) => void;
  onBack: () => void;
}

interface ActionSuggestions {
  ctas?: string[];
  value_props?: Array<{
    prop: string;
    evidence: string;
    importance: "primary" | "secondary";
  }>;
}

export function ActionStage({ context, answer, onComplete, onBack }: Props) {
  return (
    <StageBase
      title="Vad ska de göra?"
      description="Definiera målet — vad är önskad handling och vilka argument backar den?"
      question="Vad vill du att målgruppen gör efter att ha sett kampanjen?"
      placeholder='T.ex. "Boka rådgivning eller räkna på sitt bolån online. Få förhandsbesked inom 24 timmar."'
      context={context}
      answer={answer}
      onComplete={onComplete}
      onBack={onBack}
      aiAssistance={{
        enabled: true,
        label: "CTA + Value Props",
        fetchSuggestions: async (ctx, currentAnswer) => {
          const res = await fetch("/api/brief/ai-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: "action",
              context: ctx,
              currentAnswer,
            }),
          });
          if (!res.ok) throw new Error("Kunde inte föreslå CTA");
          return res.json();
        },
        renderSuggestions: (data, onSelect) => {
          const typed = data as ActionSuggestions;
          return (
            <div className="space-y-3">
              {typed.ctas && typed.ctas.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-nordea-teal mb-2 uppercase tracking-wider">
                    Föreslagna CTA:er
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {typed.ctas.map((cta, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => onSelect(`CTA: ${cta}`)}
                        className="text-xs font-medium px-3 py-1.5 bg-white border border-nordea-border hover:border-nordea-teal/40 rounded-full text-nordea-text transition-colors"
                      >
                        {cta}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {typed.value_props && typed.value_props.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-nordea-teal mb-2 uppercase tracking-wider">
                    Value props
                  </p>
                  <div className="space-y-1.5">
                    {typed.value_props.map((vp, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => onSelect(`${vp.prop} (${vp.evidence})`)}
                        className="block text-left bg-white p-2 rounded-md border border-nordea-border hover:border-nordea-teal/40 w-full transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-nordea-text">
                            {vp.prop}
                          </span>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wider ${
                              vp.importance === "primary"
                                ? "text-nordea-teal"
                                : "text-nordea-text-tertiary"
                            }`}
                          >
                            {vp.importance}
                          </span>
                        </div>
                        <p className="text-xs text-nordea-text-tertiary mt-0.5">
                          {vp.evidence}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        },
      }}
    />
  );
}
