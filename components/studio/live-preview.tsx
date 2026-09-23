"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useStudioStore, ASPECT_RATIOS } from "@/lib/studio/store";
import { Loader2 } from "lucide-react";
import { CanvasOverlay } from "./canvas-overlay";
import { FeedMockup } from "@/components/preview/feed-mockup";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import type { VideoConfig } from "@/lib/remotion/types";

type PreviewMode = "canvas" | "feed";

// Rubrik/brödtext/CTA till flödets bildtext, hämtat ur scenerna.
function captionFrom(config: VideoConfig) {
  const title = config.scenes.find((s) => s.type === "title");
  const cta = config.scenes.find((s) => s.type === "cta");
  const buttonText = cta && cta.type === "cta" ? cta.buttonText : undefined;
  return {
    headline: title && title.type === "title" ? title.headline : undefined,
    body: title && title.type === "title" ? title.subtitle : undefined,
    cta: buttonText
      ? buttonText.charAt(0).toUpperCase() + buttonText.slice(1).toLowerCase()
      : "Läs mer",
  };
}

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

  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<PreviewMode>("canvas");
  // 16:9 har ingen telefonplacering — visa alltid arbetsytan.
  const feedAvailable = config.format !== "landscape";
  const showFeed = mode === "feed" && feedAvailable;

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setFrameSize({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
    // Arbetsytan monteras om när man växlar från flödesläget.
  }, [showFeed]);

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
        {feedAvailable ? (
          <SegmentedTabs<PreviewMode>
            value={mode}
            onChange={setMode}
            tabs={[
              { id: "canvas", label: "Arbetsyta" },
              { id: "feed", label: config.format === "story" ? "I story" : "I flödet" },
            ]}
          />
        ) : (
          <span className="text-xs text-nordea-text-tertiary uppercase tracking-wider font-medium">
            Förhandsvisning
          </span>
        )}
        <span className="text-xs text-nordea-text-tertiary font-mono">
          {aspectInfo.width} × {aspectInfo.height} · {totalSeconds.toFixed(1)}s
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-nordea-bg min-h-0">
        {showFeed ? (
          <FeedMockup
            placement={config.format === "story" ? "story" : "feed"}
            feedAspect={config.format === "feed" ? "1:1" : "4:5"}
            height="100%"
            {...captionFrom(config)}
          >
            <MotionPlayer key={previewKey} config={config} loop style={{ borderRadius: 0, width: "100%", height: "100%" }} />
          </FeedMockup>
        ) : (
        <div
          ref={frameRef}
          className="relative bg-white rounded-lg shadow-nordea-lg overflow-hidden"
          style={{
            aspectRatio: `${aspectInfo.width} / ${aspectInfo.height}`,
            maxHeight: "100%",
            maxWidth: "100%",
            height: isPortrait ? "100%" : "auto",
            width: isPortrait ? "auto" : "100%",
          }}
        >
          <MotionPlayer key={previewKey} config={config} loop />
          {frameSize.width > 0 && (
            <CanvasOverlay
              frameWidth={frameSize.width}
              frameHeight={frameSize.height}
            />
          )}
        </div>
        )}
      </div>
    </div>
  );
}
