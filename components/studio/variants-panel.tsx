"use client";

import { Sparkles } from "lucide-react";

export function VariantsPanel() {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-nordea-text mb-1">
          AI-varianter
        </h3>
        <p className="text-xs text-nordea-text-tertiary">
          Få förslag på alternativa versioner
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 bg-nordea-blue-soft rounded-xl flex items-center justify-center mb-3">
          <Sparkles className="w-5 h-5 text-nordea-blue" />
        </div>
        <p className="text-sm font-medium text-nordea-text mb-1">
          Kommer i Sprint 8b
        </p>
        <p className="text-xs text-nordea-text-tertiary">
          AI-varianter, chat-input och asset-picker landar i nästa sprint.
        </p>
      </div>
    </div>
  );
}
