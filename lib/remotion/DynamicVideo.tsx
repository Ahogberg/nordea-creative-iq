import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { colors, FORMAT_PRESETS, logoBox } from "./styles";
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
import { TermsSceneComponent } from "./scenes/TermsScene";
import { LegalOverlay, legalReserve } from "./legal";

import { SceneTransition } from "./animations/SceneTransition";
import { LogoReveal } from "./animations/LogoReveal";
import { renderSceneAssets } from "./scene-utils";
import { SceneThemeContext, themeFor } from "./theme";

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
      return (
        <CanvasSceneComponent
          scene={scene}
          width={width}
          motion={motion}
          durationFrames={durationFrames}
        />
      );
    case "terms":
      return <TermsSceneComponent scene={scene} width={width} durationFrames={durationFrames} />;
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
  const frame = useCurrentFrame();
  const format = FORMAT_PRESETS[config.format] || FORMAT_PRESETS.story;
  const { width, height } = format;
  // Backward-compat: older templates without motion fall back to the default.
  const motion = config.motion ?? DEFAULT_MOTION_CONFIG;
  const timings = useMemo(() => computeSceneTimings(config.scenes), [config.scenes]);
  const background = config.backgroundColor || colors.nordeaBlue;
  const rootTheme = themeFor(background, config.headlineColor);
  // En scen kan ha egen bakgrund och rubrikfärg — temat följer den.
  const sceneTheme = (scene: Scene) =>
    themeFor(scene.background ?? background, scene.headlineColor ?? config.headlineColor);

  // Aktuell scen: loggan och riskraden byter färg med scenens bakgrund
  // (vit logga på blått, blå på persika eller ljusblått).
  const currentIndex = timings.findIndex(
    (t) => frame >= t.startFrame && frame < t.startFrame + t.durationFrames
  );
  const currentScene = config.scenes[currentIndex >= 0 ? currentIndex : config.scenes.length - 1];
  const currentTheme = currentScene ? sceneTheme(currentScene) : rootTheme;

  const logo = logoBox(width, height);

  // Juridisk text nertill: scenerna ritas ovanför den.
  const reserve = legalReserve(config.legal, config.format, height);

  return (
    <SceneThemeContext.Provider value={rootTheme}>
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
            <SceneThemeContext.Provider value={sceneTheme(scene)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: reserve }}>
            <SceneTransition
              startFrame={0}
              endFrame={durationFrames}
              inTransition={motion.transitions.style}
              outTransition={motion.transitions.style}
              transitionDuration={motion.transitions.duration}
            >
              {renderScene(scene, width, motion, durationFrames)}
              {renderSceneAssets(scene, width / 1080)}
            </SceneTransition>
            </div>
            </SceneThemeContext.Provider>
          </Sequence>
        );
      })}

      {config.legal && (
        <LegalOverlay
          legal={config.legal}
          format={config.format}
          width={width}
          height={height}
          textColor={currentTheme.text}
        />
      )}

      {config.showLogo && (
        <SceneThemeContext.Provider value={currentTheme}>
          <LogoReveal
            style={motion.logo.reveal}
            src={config.logo?.url}
            startFrame={0}
            durationFrames={motion.logo.duration}
            videoWidth={width}
            transform={config.logo?.transform}
            position="top-center"
            // Storlek och läge per format enligt Nordeas annonser (LOGO_LAYOUT).
            size={logo.width}
            topOffset={logo.top}
          />
        </SceneThemeContext.Provider>
      )}
    </AbsoluteFill>
    </SceneThemeContext.Provider>
  );
};
