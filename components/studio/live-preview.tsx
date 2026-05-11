"use client";

import dynamic from "next/dynamic";
import { useStudioStore, ASPECT_RATIOS } from "@/lib/studio/store";
import { Loader2 } from "lucide-react";

// Remotion Player pulls a sizeable client-side dep tree. Dynamic-import
// keeps it out of the server bundle and gives us a clean loading state.
const MotionPlayer = dynamic(
  () =>
    import("@/lib/remotion/PlayerWrapper").then((m) => ({
      default: m.MotionPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    ),
  }
);

export function LivePreview() {
  const config = useStudioStore((s) => s.config);
  const previewKey = useStudioStore((s) => s.previewKey);
  const aspectInfo = ASPECT_RATIOS[config.format];
  const totalSeconds = config.scenes.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  );

  if (config.scenes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-nordea-text-tertiary mb-2">
            Inga scener att förhandsvisa
          </p>
          <p className="text-sm text-nordea-text-secondary">
            Lägg till en scen i tidslinjen för att börja
          </p>
        </div>
      </div>
    );
  }

  // Aspect-ratio-aware sizing: portrait formats fill height; landscape fills
  // width. The outer container's flex-center handles centering.
  const isPortrait = aspectInfo.height > aspectInfo.width;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-3 flex items-center justify-between border-b border-nordea-hairline bg-white flex-shrink-0">
        <span className="text-xs text-nordea-text-tertiary uppercase tracking-wider font-medium">
          Förhandsvisning
        </span>
        <span className="text-xs text-nordea-text-tertiary font-mono">
          {aspectInfo.width} × {aspectInfo.height} · {totalSeconds.toFixed(1)}s
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-nordea-bg min-h-0">
        <div
          className="bg-white rounded-lg shadow-nordea-lg overflow-hidden"
          style={{
            aspectRatio: `${aspectInfo.width} / ${aspectInfo.height}`,
            maxHeight: "100%",
            maxWidth: "100%",
            height: isPortrait ? "100%" : "auto",
            width: isPortrait ? "auto" : "100%",
          }}
        >
          <MotionPlayer key={previewKey} config={config} loop />
        </div>
      </div>
    </div>
  );
}
