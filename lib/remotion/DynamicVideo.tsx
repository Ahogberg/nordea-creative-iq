import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { colors, FORMAT_PRESETS } from "./styles";
import type { VideoConfig, Scene, MotionConfig } from "./types";
import { DEFAULT_MOTION_CONFIG } from "./types";

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

import { SceneTransition } from "./animations/SceneTransition";
import { LogoReveal } from "./animations/LogoReveal";

const FPS = 30;

function renderScene(
  scene: Scene,
  width: number,
  motion: MotionConfig,
  durationFrames: number
) {
  switch (scene.type) {
    case "title":
      return (
        <TitleSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
    case "counter":
      return (
        <CounterSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
    case "bars":
      return <BarsSceneComponent scene={scene} width={width} />;
    case "text-reveal":
      return (
        <TextRevealSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
    case "icon-grid":
      return <IconGridSceneComponent scene={scene} width={width} />;
    case "cta":
      return (
        <CtaSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
    case "split":
      return <SplitSceneComponent scene={scene} width={width} />;
    case "highlight-number":
      return (
        <HighlightNumberSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
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

export const DynamicVideo: React.FC<{ config: VideoConfig }> = ({ config }) => {
  const format = FORMAT_PRESETS[config.format] || FORMAT_PRESETS.story;
  const { width } = format;
  // Backward-compat: older templates without motion fall back to the default.
  const motion = config.motion ?? DEFAULT_MOTION_CONFIG;
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
            <SceneTransition
              startFrame={0}
              endFrame={durationFrames}
              inTransition={motion.transitions.style}
              outTransition={motion.transitions.style}
              transitionDuration={motion.transitions.duration}
            >
              {renderScene(scene, width, motion, durationFrames)}
            </SceneTransition>
          </Sequence>
        );
      })}

      {config.showLogo && (
        <LogoReveal
          style={motion.logo.reveal}
          src={config.logo?.url}
          startFrame={0}
          durationFrames={motion.logo.duration}
          videoWidth={width}
          transform={config.logo?.transform}
          position="top-center"
        />
      )}
    </AbsoluteFill>
  );
};
