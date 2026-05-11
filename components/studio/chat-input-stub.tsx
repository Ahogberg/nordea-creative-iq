"use client";

import { Sparkles, ArrowUp } from "lucide-react";

/**
 * Disabled placeholder for the chat-driven AI flow. Sits between the live
 * preview and the timeline so users can see where the chat will live —
 * full impl in Sprint 8b.
 */
export function ChatInputStub() {
  return (
    <div
      className="px-6 py-3 border-t border-nordea-hairline bg-white flex-shrink-0"
      title="Chat-input kommer i Sprint 8b"
    >
      <div className="relative max-w-3xl mx-auto opacity-60 cursor-not-allowed">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nordea-blue" />
        <input
          type="text"
          disabled
          placeholder="Beskriv ändringar du vill göra…"
          className="w-full h-10 pl-9 pr-12 bg-nordea-bg-hover border border-nordea-border rounded-lg text-sm text-nordea-text-tertiary placeholder:text-nordea-text-tertiary cursor-not-allowed"
        />
        <button
          type="button"
          disabled
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-nordea-blue text-white rounded-md flex items-center justify-center cursor-not-allowed"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-nordea-text-tertiary mt-1.5 text-center">
        Chat-input kommer i Sprint 8b
      </p>
    </div>
  );
}
