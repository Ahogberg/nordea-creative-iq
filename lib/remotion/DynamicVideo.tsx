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
const NordeaLogo: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 5, 20);
  const scale = width / 1080;

  return (
    <div
      style={{
        position: "absolute",
        top: 60 * scale,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
    </div>
  );
};

// ── Main dynamic video composition ──
export const DynamicVideo: React.FC<{ config: VideoConfig }> = ({ config }) => {
  const format = FORMAT_PRESETS[config.format] || FORMAT_PRESETS.story;
  const { width } = format;
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

      {config.showLogo && <NordeaLogo width={width} />}
    </AbsoluteFill>
  );
};
