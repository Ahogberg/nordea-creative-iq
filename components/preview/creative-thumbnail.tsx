"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Play } from "lucide-react";
import { FORMAT_PRESETS } from "@/lib/remotion/styles";
import type { VideoConfig } from "@/lib/remotion/types";

const FPS = 30;

interface StillProps {
  config: VideoConfig;
  width: number;
  height: number;
  frame: number;
  durationInFrames: number;
}

// Remotion-komponenterna laddas bara i webbläsaren.
const Still = dynamic(
  () =>
    Promise.all([import("@remotion/player"), import("@/lib/remotion/DynamicVideo")]).then(
      ([player, video]) =>
        function RemotionStill({ config, width, height, frame, durationInFrames }: StillProps) {
          return (
            <player.Thumbnail
              component={video.DynamicVideo}
              inputProps={{ config }}
              compositionWidth={width}
              compositionHeight={height}
              frameToDisplay={frame}
              durationInFrames={durationInFrames}
              fps={FPS}
              style={{ width: "100%", height: "100%" }}
            />
          );
        }
    ),
  { ssr: false }
);
const MotionPlayer = dynamic(
  () => import("@/lib/remotion/PlayerWrapper").then((m) => ({ default: m.MotionPlayer })),
  { ssr: false }
);


interface CreativeThumbnailProps {
  config: VideoConfig;
  /** Sekund att visa som stillbild. Standard: när första scenens text står klar. */
  atSeconds?: number;
  /** Spela upp videon när man håller musen över. */
  playOnHover?: boolean;
  className?: string;
  rounded?: string;
}

/**
 * Riktig miniatyr av en annons: en renderad bildruta ur VideoConfig:en som
 * blir levande vid hover. Ersätter de randiga platshållarna.
 */
export function CreativeThumbnail({
  config,
  atSeconds,
  playOnHover = true,
  className = "",
  rounded = "rounded-lg",
}: CreativeThumbnailProps) {
  const [hovering, setHovering] = useState(false);
  const format = FORMAT_PRESETS[config.format] ?? FORMAT_PRESETS.story;
  const durationInFrames = Math.max(
    1,
    Math.round(config.scenes.reduce((s, sc) => s + sc.durationSeconds, 0) * FPS)
  );
  const frame = Math.min(
    durationInFrames - 1,
    Math.round((atSeconds ?? Math.min(1.8, (config.scenes[0]?.durationSeconds ?? 2) * 0.8)) * FPS)
  );

  return (
    <div
      className={`group relative overflow-hidden ${rounded} ${className}`}
      style={{ aspectRatio: `${format.width} / ${format.height}`, backgroundColor: config.backgroundColor }}
      onMouseEnter={() => playOnHover && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {hovering ? (
        <MotionPlayer config={config} loop style={{ borderRadius: 0, width: "100%", height: "100%" }} />
      ) : (
        <Still
          config={config}
          width={format.width}
          height={format.height}
          frame={frame}
          durationInFrames={durationInFrames}
        />
      )}
      {playOnHover && !hovering && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-nordea-blue fill-nordea-blue ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
