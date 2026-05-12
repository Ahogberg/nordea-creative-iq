"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { AspectRatioTabs } from "@/components/studio/aspect-ratio-tabs";
import { PropertyPanel } from "@/components/studio/property-panel";
import { LivePreview } from "@/components/studio/live-preview";
import { VariantsPanel } from "@/components/studio/variants-panel";
import { Timeline } from "@/components/studio/timeline";
import { ChatInput } from "@/components/studio/chat-input";

/**
 * Motion Studio (Sprint 8a redesign)
 *
 * Property-driven Studio with a 3-column body + timeline footer. State
 * lives in lib/studio/store (Zustand) so every panel reads/writes the
 * same VideoConfig. Render pipeline (lib/remotion/DynamicVideo) is
 * untouched — the new UI is purely an additional layer above it.
 *
 * Bug fix (fix/create-prompt-to-config): `?prompt=` from /create now
 * actually hits Claude and loads a generated VideoConfig instead of
 * silently dropping the user's input on the default template.
 */
function StudioPageInner() {
  const searchParams = useSearchParams();
  const promptFromUrl = searchParams.get("prompt");

  // Local rather than store-level so it doesn't collide with the variants
  // panel's "Genererar varianter…" state — these are two different flows.
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (!promptFromUrl || processedRef.current) return;
    processedRef.current = true;

    let cancelled = false;
    setIsProcessingPrompt(true);
    setPromptError(null);

    (async () => {
      try {
        const res = await fetch("/api/studio/initial-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptFromUrl }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || "Kunde inte tolka prompten");
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.config) {
          useStudioStore.getState().loadConfig(data.config);
        }
      } catch (err) {
        if (cancelled) return;
        setPromptError(
          err instanceof Error ? err.message : "Något gick fel"
        );
      } finally {
        if (!cancelled) setIsProcessingPrompt(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promptFromUrl]);

  return (
    <div className="flex flex-col h-screen bg-nordea-bg overflow-hidden relative">
      <StudioTopbar />
      <AspectRatioTabs />

      <div className="flex-1 flex min-h-0">
        <div className="w-[330px] border-r border-nordea-border bg-white overflow-y-auto">
          <PropertyPanel />
        </div>

        <div className="flex-1 flex flex-col bg-nordea-bg min-w-0">
          <LivePreview />
          <ChatInput />
        </div>

        <div className="w-[320px] border-l border-nordea-border bg-white overflow-y-auto">
          <VariantsPanel />
        </div>
      </div>

      <div className="h-[120px] border-t border-nordea-border bg-white flex-shrink-0">
        <Timeline />
      </div>

      {isProcessingPrompt && <PromptOverlay prompt={promptFromUrl ?? ""} />}
      {!isProcessingPrompt && promptError && (
        <PromptErrorToast
          message={promptError}
          onDismiss={() => setPromptError(null)}
        />
      )}
    </div>
  );
}

function PromptOverlay({ prompt }: { prompt: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-nordea-deep/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-7 max-w-md mx-4 text-center">
        <div className="w-12 h-12 bg-nordea-blue-soft rounded-xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-5 h-5 text-nordea-blue" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 text-nordea-blue animate-spin" />
          <p className="text-sm font-medium text-nordea-text">
            Genererar din video från prompt…
          </p>
        </div>
        <p className="text-xs text-nordea-text-tertiary line-clamp-2">
          &ldquo;{prompt}&rdquo;
        </p>
        <p className="text-[11px] text-nordea-text-tertiary mt-3">
          ~10–15 sekunder
        </p>
      </div>
    </div>
  );
}

function PromptErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white border border-nordea-rose/20 rounded-lg shadow-md px-4 py-3 flex items-start gap-3 max-w-md">
        <AlertCircle className="w-4 h-4 text-nordea-rose flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-nordea-text">
            Kunde inte generera från prompt
          </p>
          <p className="text-[11px] text-nordea-text-tertiary mt-0.5">
            {message} · default-mall används
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-nordea-text-tertiary hover:text-nordea-text flex-shrink-0"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}

export default function MotionStudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPageInner />
    </Suspense>
  );
}
