"use client";

import { useState } from "react";
import { Brain, ChevronDown, Sparkles } from "lucide-react";

interface Props {
  thinking?: string;
  show: boolean;
}

// Opt-in transparent reveal of AI:s reasoning. Default collapsed so det inte
// stör flödet; användaren klickar för att förstå varför AI:n föreslog det
// den föreslog.
export function AIThinkingOverlay({ thinking, show }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!show || !thinking) return null;

  return (
    <div className="mt-3 bg-gradient-to-br from-nordea-blue/5 to-nordea-teal/5 border border-nordea-blue/15 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-nordea-blue" />
          <span className="text-xs font-medium text-nordea-text">
            AI:s resonemang
          </span>
          <Sparkles className="w-3 h-3 text-nordea-teal" />
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-nordea-text-tertiary transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-xs leading-relaxed text-nordea-text-secondary italic">
            &ldquo;{thinking}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
