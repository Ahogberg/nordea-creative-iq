import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { fadeIn } from "./utils";
import { colors, fonts, FORMAT_PRESETS } from "./styles";
import type { VideoConfig, Scene } from "./types";

import { TitleSceneComponent } from "./scenes/TitleScene";
import { CounterSceneComponent } from "./scenes/CounterScene";
import { BarsSceneComponent } from "./scenes/BarsScene";
import { TextRevealSceneComponent } from "./scenes/TextRevealScene";
import { IconGridSceneComponent } from "./scenes/IconGridScene";
import { CtaSceneComponent } from "./scenes/CtaScene";
import { SplitSceneComponent } from "./scenes/SplitScene";
import { HighlightNumberSceneComponent } from "./scenes/HighlightNumberScene";
import { LottieSceneComponent } from "./scenes/LottieScene";
import { CanvasSceneComponent } from "./scenes/CanvasScene";

const FPS = 30;

function renderScene(scene: Scene, width: number) {
  switch (scene.type) {
    case "title":
      return <TitleSceneComponent scene={scene} width={width} />;
    case "counter":
      return <CounterSceneComponent scene={scene} width={width} />;
    case "bars":
      return <BarsSceneComponent scene={scene} width={width} />;
    case "text-reveal":
      return <TextRevealSceneComponent scene={scene} width={width} />;
    case "icon-grid":
      return <IconGridSceneComponent scene={scene} width={width} />;
    case "cta":
      return <CtaSceneComponent scene={scene} width={width} />;
    case "split":
      return <SplitSceneComponent scene={scene} width={width} />;
    case "highlight-number":
      return <HighlightNumberSceneComponent scene={scene} width={width} />;
    case "lottie":
      return <LottieSceneComponent scene={scene} width={width} />;
    case "canvas":
      return <CanvasSceneComponent scene={scene} width={width} />;
    default:
      return null;
  }
}

function computeSceneTimings(scenes: Scene[]) {
  const timings: Array<{ startFrame: number; durationFrames: number }> = [];
  let frame = 0;
  for (const scene of scenes) {
    const durationFrames = Math.round(scene.durationSeconds * FPS);
    timings.push({ startFrame: frame, durationFrames });
    frame += durationFrames;
  }
  return timings;
}

// ── Logo overlay ──
// Renders either the uploaded logo image (if logo.url set) or the default
// "N + Nordea" text lockup. Position/size honour logo.transform when provided;
// otherwise falls back to top-center at ~15% canvas width.
const LogoOverlay: React.FC<{
  width: number;
  height: number;
  logo?: VideoConfig["logo"];
}> = ({ width, height, logo }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 5, 20);
  const scale = width / 1080;

  const transform = logo?.transform;
  const hasCustomPosition = !!transform;

  // Default logo width = 15% of canvas width
  const baseWidthPx = width * 0.15;
  const renderScale = transform?.scale ?? 1;
  const logoWidthPx = baseWidthPx * renderScale;

  // Position: transform.x/y are fractions of canvas (0-1), pointing to element center.
  // Default: top-center, 5% from top.
  const xFrac = transform?.x ?? 0.5;
  const yFrac = transform?.y ?? 0.05;
  const rotation = transform?.rotation ?? 0;

  const posStyle: React.CSSProperties = hasCustomPosition
    ? {
        position: "absolute",
        left: `${xFrac * 100}%`,
        top: `${yFrac * 100}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: logoWidthPx,
        opacity,
        zIndex: 100,
      }
    : {
        position: "absolute",
        top: 60 * scale,
        left: "50%",
        transform: `translateX(-50%) rotate(${rotation}deg)`,
        width: logoWidthPx,
        opacity,
        zIndex: 100,
      };

  // Custom uploaded logo
  if (logo?.url) {
    return (
      <div style={posStyle}>
        <img
          src={logo.url}
          alt="Logo"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    );
  }

  // Default "N + Nordea" text lockup (legacy)
  return (
    <div
      style={{
        ...posStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: hasCustomPosition ? logoWidthPx : undefined,
        gap: 12 * scale,
      }}
    >
      <div
        style={{
          width: 44 * scale,
          height: 44 * scale,
          borderRadius: 10 * scale,
          backgroundColor: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.headline,
          fontSize: Math.round(26 * scale),
          fontWeight: 900,
          color: colors.white,
          flexShrink: 0,
        }}
      >
        N
      </div>
      <span
        style={{
          fontFamily: fonts.headline,
          fontSize: Math.round(28 * scale),
          fontWeight: 700,
          color: colors.white,
          letterSpacing: "0.04em",
        }}
      >
        Nordea
      </span>
    </div>
  );
};

// ── Main dynamic video composition ──
export const DynamicVideo: React.FC<{ config: VideoConfig }> = ({ config }) => {
  const format = FORMAT_PRESETS[config.format] || FORMAT_PRESETS.story;
  const { width, height } = format;
  const timings = useMemo(() => computeSceneTimings(config.scenes), [config.scenes]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.backgroundColor || colors.nordeaBlue,
        overflow: "hidden",
      }}
    >
      {config.scenes.map((scene, i) => {
        const { startFrame, durationFrames } = timings[i];
        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
            {renderScene(scene, width)}
          </Sequence>
        );
      })}

      {config.showLogo && (
        <LogoOverlay width={width} height={height} logo={config.logo} />
      )}
    </AbsoluteFill>
  );
};
