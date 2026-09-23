"use client";

// Mitten av Motion Studio: videon stor på en lugn yta, formatväxling och
// visningsläge ovanpå, uppspelningsreglage under.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, LayoutPanelTop, Sparkles } from "lucide-react";
import { useStudioStore, ASPECT_RATIOS, type AspectRatio } from "@/lib/studio/store";
import { stripRichText } from "@/lib/remotion/rich-text";
import type { VideoConfig } from "@/lib/remotion/types";
import { FeedMockup } from "@/components/preview/feed-mockup";
import { CanvasOverlay } from "./canvas-overlay";
import { SafeZoneOverlay } from "./safe-zone-overlay";
import { useStudioPlayer, STUDIO_FPS } from "./player-context";

const MotionPlayer = dynamic(
  () => import("@/lib/remotion/PlayerWrapper").then((m) => ({ default: m.MotionPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    ),
  }
);

type ViewMode = "canvas" | "feed";

const FORMAT_ORDER: AspectRatio[] = ["story", "vertical", "feed", "landscape"];

// Rubrik/brödtext till flödets bildtext, hämtat ur scenerna.
function captionFrom(config: VideoConfig) {
  const first = config.scenes.find((s) => s.type === "title" || s.type === "canvas");
  const headline =
    first && (first.type === "title" || first.type === "canvas") ? first.headline : undefined;
  const body = first && (first.type === "title" || first.type === "canvas") ? first.subtitle : undefined;
  return {
    headline: headline ? stripRichText(headline) : undefined,
    body: body ? stripRichText(body) : undefined,
    cta: "Läs mer",
  };
}

export function Stage() {
  const config = useStudioStore((s) => s.config);
  const previewKey = useStudioStore((s) => s.previewKey);
  const setAspectRatio = useStudioStore((s) => s.setAspectRatio);
  const isDrafting = useStudioStore((s) => s.isDrafting);
  const { attach } = useStudioPlayer();

  const [view, setView] = useState<ViewMode>("canvas");
  const [showSafe, setShowSafe] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });

  const aspect = ASPECT_RATIOS[config.format];
  const feedAvailable = config.format !== "landscape";
  const showFeed = view === "feed" && feedAvailable;

  // Ytan som videon får plats i — ramen räknas ut så att den alltid har
  // formatets exakta proportioner (contain), oavsett panelernas bredd.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setArea({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ratio = aspect.width / aspect.height;
  const frameWidth = Math.floor(Math.max(0, Math.min(area.width, area.height * ratio)));
  const frameHeight = Math.floor(frameWidth / ratio);
  const frameSize = { width: frameWidth, height: frameHeight };

  return (
    <div
      className="relative flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(rgba(0,0,94,0.07) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Verktygsrad ovanpå scenen */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 flex-shrink-0">
        <div className="flex items-center gap-0.5 bg-white border border-nordea-border rounded-lg p-0.5 shadow-sm">
          {FORMAT_ORDER.map((key) => {
            const active = config.format === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAspectRatio(key)}
                title={`${ASPECT_RATIOS[key].label} (${ASPECT_RATIOS[key].ratio})`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium tabular-nums transition-colors ${
                  active
                    ? "bg-nordea-blue text-white"
                    : "text-nordea-text-secondary hover:text-nordea-text hover:bg-nordea-bg-hover"
                }`}
              >
                {ASPECT_RATIOS[key].ratio}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {feedAvailable && (
            <div className="flex items-center gap-0.5 bg-white border border-nordea-border rounded-lg p-0.5 shadow-sm">
              {(["canvas", "feed"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    view === mode
                      ? "bg-nordea-blue-soft text-nordea-blue"
                      : "text-nordea-text-secondary hover:text-nordea-text"
                  }`}
                >
                  {mode === "canvas" ? "Arbetsyta" : config.format === "story" ? "I story" : "I flödet"}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowSafe((v) => !v)}
            aria-pressed={showSafe}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-sm transition-colors ${
              showSafe
                ? "bg-nordea-rose-soft border-nordea-rose/30 text-nordea-rose"
                : "bg-white border-nordea-border text-nordea-text-secondary hover:text-nordea-text"
            }`}
          >
            <LayoutPanelTop className="w-3.5 h-3.5" />
            Safe zone
          </button>
        </div>
      </div>

      {/* Videon */}
      <div ref={areaRef} className="relative flex-1 min-h-0 mx-8 my-5 flex items-center justify-center">
        {showFeed ? (
          <FeedMockup
            placement={config.format === "story" ? "story" : "feed"}
            feedAspect={config.format === "feed" ? "1:1" : "4:5"}
            height="100%"
            {...captionFrom(config)}
          >
            <MotionPlayer
              key={previewKey}
              config={config}
              loop
              playerRef={attach}
              style={{ borderRadius: 0, width: "100%", height: "100%" }}
            />
          </FeedMockup>
        ) : (
          <div
            className="relative bg-white rounded-xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,94,0.28)] ring-1 ring-nordea-border flex-shrink-0"
            style={{ width: frameWidth, height: frameHeight }}
          >
            {config.scenes.length > 0 ? (
              <MotionPlayer key={previewKey} config={config} loop playerRef={attach} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-nordea-text-tertiary p-6 text-center">
                Inga scener än — beskriv din video i chatten
              </div>
            )}
            {frameSize.width > 0 && !isDrafting && (
              <CanvasOverlay frameWidth={frameSize.width} frameHeight={frameSize.height} />
            )}
            {showSafe && frameSize.width > 0 && (
              <SafeZoneOverlay config={config} frameWidth={frameSize.width} frameHeight={frameSize.height} />
            )}
            {isDrafting && <DraftingVeil />}
          </div>
        )}
      </div>

      <Transport />
    </div>
  );
}

function DraftingVeil() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-nordea-deep/55 backdrop-blur-[2px] text-white">
      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>
      <p className="text-sm font-medium">Skapar första utkastet…</p>
    </div>
  );
}

function Transport() {
  const config = useStudioStore((s) => s.config);
  const { frame, playing, toggle, seekToSeconds } = useStudioPlayer();
  const total = config.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const seconds = frame / STUDIO_FPS;
  const pct = total > 0 ? Math.min(100, (seconds / total) * 100) : 0;
  const fmt = (s: number) => s.toFixed(1).replace(".", ",");

  return (
    <div className="flex items-center justify-center pb-4 px-4 flex-shrink-0">
      <div className="flex items-center gap-3 w-full max-w-[380px] bg-white border border-nordea-border rounded-full pl-1.5 pr-4 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausa" : "Spela"}
          className="w-8 h-8 rounded-full bg-nordea-blue text-white flex items-center justify-center hover:bg-nordea-deep transition-colors"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(total, 0.1)}
          step={1 / STUDIO_FPS}
          value={Math.min(seconds, total)}
          onChange={(e) => seekToSeconds(parseFloat(e.target.value))}
          aria-label="Tidpunkt"
          className="flex-1 min-w-0 accent-nordea-blue"
          style={{
            background: `linear-gradient(to right, #0000A0 ${pct}%, rgba(0,0,94,0.12) ${pct}%)`,
          }}
        />
        <span className="text-xs tabular-nums text-nordea-text-secondary min-w-[64px] text-right">
          {fmt(Math.min(seconds, total))} / {fmt(total)} s
        </span>
      </div>
    </div>
  );
}
