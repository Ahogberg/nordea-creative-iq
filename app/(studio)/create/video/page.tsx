"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/lib/studio/store";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { ChatPanel } from "@/components/studio/chat-panel";
import { Stage } from "@/components/studio/stage";
import { SceneStrip } from "@/components/studio/scene-strip";
import { LayerTracks } from "@/components/studio/layer-tracks";
import { Inspector } from "@/components/studio/inspector";
import { StudioPlayerProvider } from "@/components/studio/player-context";

/**
 * Motion Studio
 *
 * Helskärm (egen route-grupp utan sidomeny):
 *   toppbar
 *   chatt | videoscen + scenkort | ikonlist med infällbar inspektör
 *
 * Chatten är huvudvägen in: ?prompt= från /create blir första meddelandet och
 * genererar ett utkast; sedan ändras videon genom att prata med AI:n. All
 * state ligger i lib/studio/store; renderaren (lib/remotion) är oförändrad.
 */
function StudioPageInner() {
  const searchParams = useSearchParams();
  const promptFromUrl = searchParams.get("prompt");
  const processedRef = useRef(false);

  useEffect(() => {
    if (!promptFromUrl || processedRef.current) return;
    processedRef.current = true;
    void useStudioStore.getState().startFromPrompt(promptFromUrl);
  }, [promptFromUrl]);

  // Markerar man ett element på videon eller en keyframe öppnas scenens egenskaper.
  useEffect(() => {
    const openScene = () => useStudioStore.getState().setInspectorTab("scene");
    const offElement = useStudioStore.subscribe((s) => s.selectedElementId, (id) => id && openScene());
    // Keyframes: bara på breda skärmar — på smala lägger sig panelen över
    // lagerspåret och skymmer det man drar i.
    const offKeyframe = useStudioStore.subscribe(
      (s) => s.selectedKeyframe?.layerId ?? null,
      (layerId) => layerId && window.matchMedia("(min-width: 1280px)").matches && openScene()
    );
    return () => {
      offElement();
      offKeyframe();
    };
  }, []);

  return (
    <StudioPlayerProvider>
      <div className="h-full flex flex-col">
        <StudioTopbar />
        <div className="flex-1 min-h-0 flex">
          <ChatPanel />
          <main className="flex-1 min-w-0 flex flex-col">
            <Stage />
            <LayerTracks />
            <SceneStrip />
          </main>
          <Inspector />
        </div>
      </div>
    </StudioPlayerProvider>
  );
}

export default function MotionStudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPageInner />
    </Suspense>
  );
}
