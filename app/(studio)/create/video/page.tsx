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
import { VideoBrief } from "@/components/studio/video-brief";
import { CampaignGate } from "@/components/studio/campaign-gate";

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
  const campaignFromUrl = searchParams.get("campaign");
  const processedRef = useRef<string | null>(null);
  const scenes = useStudioStore(s => s.config.scenes);
  const scenesOpen = useStudioStore(s => s.scenesOpen);
  const editorMode = useStudioStore(s => s.editorMode);
  const busy = useStudioStore(s => s.isChatBusy);
  const newFromUrl = searchParams.get("new");
  const openCampaignId = useStudioStore((s) => s.campaign?.id);

  useEffect(() => {
    const entry = promptFromUrl ?? (newFromUrl === "1" ? "new" : null);
    if (!entry || processedRef.current === entry || busy) return;
    if (campaignFromUrl ? openCampaignId !== campaignFromUrl : !!openCampaignId) return;
    processedRef.current = entry;
    useStudioStore.getState().resetDraft();
    if (promptFromUrl) void useStudioStore.getState().startFromPrompt(`Skapa en hel sammanhängande video: ${promptFromUrl}`, promptFromUrl);
  }, [promptFromUrl, newFromUrl, campaignFromUrl, openCampaignId, busy]);

  // Markerar man ett element på videon eller en keyframe öppnas scenens egenskaper.
  useEffect(() => {
    const openScene = () => useStudioStore.setState({ scenesOpen: true, inspectorTab: "scene" });
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

  // ?campaign=<id>: kampanjens video laddas och ändringar sparas tillbaka.
  return (
    <CampaignGate campaignId={campaignFromUrl}>
      <StudioPlayerProvider>
        {scenes.length === 0 ? <VideoBrief initialIdea={promptFromUrl ?? ""} /> : (
          <div className="h-full flex flex-col">
            <StudioTopbar />
            <div className="flex-1 min-h-0 flex">
              <ChatPanel />
              <main className="flex-1 min-w-0 flex flex-col">
                <Stage />
                <div className="border-t border-nordea-border bg-white p-3 flex flex-wrap items-center justify-between gap-3">
                  <button type="button" aria-expanded={scenesOpen} aria-controls="studio-scenes" onClick={() => useStudioStore.setState({ scenesOpen: !scenesOpen, inspectorTab: null, promptScope: "video", selectedElementId: null, selectedKeyframe: null })} className="nordea-btn nordea-btn-secondary nordea-btn-sm">{scenesOpen ? "Stäng scenredigering" : "Redigera scener"}</button>
                  {scenesOpen ? <label className="text-xs text-nordea-text-secondary flex items-center gap-2">Redigeringsläge<select aria-label="Redigeringsläge" value={editorMode} onChange={e => useStudioStore.setState({ editorMode: e.target.value as "basic" | "advanced", inspectorTab: "scene" })} className="nordea-input h-8 text-xs"><option value="basic">Grundläggande</option><option value="advanced">Avancerad · lager och keyframes</option></select></label> : <p className="text-xs text-nordea-text-tertiary">Se hela filmen och beskriv vad du vill förbättra.</p>}
                </div>
                {scenesOpen && <div id="studio-scenes">{editorMode === "advanced" && <LayerTracks />}<SceneStrip /></div>}
              </main>
              {scenesOpen && <Inspector />}
            </div>
          </div>
        )}
      </StudioPlayerProvider>
    </CampaignGate>
  );
}

export default function MotionStudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPageInner />
    </Suspense>
  );
}
