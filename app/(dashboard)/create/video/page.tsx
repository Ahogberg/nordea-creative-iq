"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/lib/studio/store";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { AspectRatioTabs } from "@/components/studio/aspect-ratio-tabs";
import { PropertyPanel } from "@/components/studio/property-panel";
import { LivePreview } from "@/components/studio/live-preview";
import { VariantsPanel } from "@/components/studio/variants-panel";
import { Timeline } from "@/components/studio/timeline";

/**
 * Motion Studio (Sprint 8a redesign)
 *
 * Property-driven Studio with a 3-column body + timeline footer. State
 * lives in lib/studio/store (Zustand) so every panel reads/writes the
 * same VideoConfig. Render pipeline (lib/remotion/DynamicVideo) is
 * untouched — the new UI is purely an additional layer above it.
 *
 * Sprint 8b will bring back the chat-driven AI flow on top of this
 * foundation, plus save/export/asset-picker.
 */
function StudioPageInner() {
  const searchParams = useSearchParams();
  const promptFromUrl = searchParams.get("prompt");

  useEffect(() => {
    if (promptFromUrl) {
      // TODO Sprint 8b — feed prompt into Claude scene-generator and
      // load the result via useStudioStore.getState().loadConfig().
    }
  }, [promptFromUrl]);

  return (
    <div className="flex flex-col h-screen bg-nordea-bg overflow-hidden">
      <StudioTopbar />
      <AspectRatioTabs />

      <div className="flex-1 flex min-h-0">
        <div className="w-[330px] border-r border-nordea-border bg-white overflow-y-auto">
          <PropertyPanel />
        </div>

        <div className="flex-1 flex flex-col bg-nordea-bg min-w-0">
          <LivePreview />
        </div>

        <div className="w-[320px] border-l border-nordea-border bg-white overflow-y-auto">
          <VariantsPanel />
        </div>
      </div>

      <div className="h-[120px] border-t border-nordea-border bg-white flex-shrink-0">
        <Timeline />
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
