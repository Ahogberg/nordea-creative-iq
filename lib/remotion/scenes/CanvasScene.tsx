import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  interpolate,
  interpolateColors,
  spring,
  useVideoConfig,
  random,
  Easing,
} from "remotion";
import { colors, fonts, headlineScale, type SafeInsets } from "../styles";
import { useSafeArea } from "../safe-area";
import { Layer, LayersContext, useLayer } from "../layers";
import * as animUtils from "../utils";
import * as kit from "../illustration/toolkit";
import type { CanvasScene as CanvasSceneProps, MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { useSceneTheme } from "../theme";
import { RichText } from "../rich-text";
import { StaggeredText } from "../animations/StaggeredText";
import { fadeSlideUp } from "../utils";
import { resolveBackground } from "../scene-utils";

const FPS = 30;

// ── Whitelisted scope injected into AI-generated component code ──
// The compiled JS is executed via `new Function` with these names in scope.
// Add new bindings here if the AI needs more primitives.
const buildScope = () => ({
  React,
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  interpolate,
  interpolateColors,
  spring,
  useVideoConfig,
  random,
  Easing,
  colors,
  fonts,
  RichText,
  // Animation helpers from lib/remotion/utils.ts
  fadeIn: animUtils.fadeIn,
  fadeSlideUp: animUtils.fadeSlideUp,
  counterValue: animUtils.counterValue,
  barGrow: animUtils.barGrow,
  scalePop: animUtils.scalePop,
  easeOutExpo: animUtils.easeOutExpo,
  easeInOutCubic: animUtils.easeInOutCubic,
  easeOutBack: animUtils.easeOutBack,
  easeOutElastic: animUtils.easeOutElastic,
  // Illustrationskit (lib/remotion/illustration/toolkit.tsx)
  palette: kit.palette,
  BLUE_FACES: kit.BLUE_FACES,
  PEACH_FACES: kit.PEACH_FACES,
  iso: kit.iso,
  IsoBox: kit.IsoBox,
  IsoFaceRect: kit.IsoFaceRect,
  IsoRoof: kit.IsoRoof,
  IsoCylinder: kit.IsoCylinder,
  IsoShadow: kit.IsoShadow,
  IsoHouse: kit.IsoHouse,
  IsoCoin: kit.IsoCoin,
  IsoCoinStack: kit.IsoCoinStack,
  Disc: kit.Disc,
  PillBars: kit.PillBars,
  Sparkle: kit.Sparkle,
  ease: kit.ease,
  progress: kit.progress,
  fall: kit.fall,
  slideIn: kit.slideIn,
  slideAlongIso: kit.slideAlongIso,
  grow: kit.grow,
  loop: kit.loop,
  bob: kit.bob,
  drawOn: kit.drawOn,
  transformAt: kit.transformAt,
  // Lager: rörelsen står i scenens `layers` (keyframes), inte i koden.
  Layer,
  useLayer,
});

type ScopeRecord = ReturnType<typeof buildScope>;
// `safe` = fri yta överst/nertill (px) som text och viktiga objekt ska hålla
// sig innanför. I illustrationsscener är hela ytan redan säker (0/0).
type SceneComponent = React.FC<{ width: number; height: number; scale: number; safe: SafeInsets }>;

const NO_INSETS: SafeInsets = { top: 0, bottom: 0 };

function compileComponent(compiledJs: string, scope: ScopeRecord): SceneComponent | null {
  try {
    const names = Object.keys(scope);
    const values = Object.values(scope);
    // The compiled code may contain `function Scene(...)` or `const Scene = ...`.
    // We append `return Scene;` to get the component out.
    const factory = new Function(...names, `"use strict"; ${compiledJs}\nreturn Scene;`);
    const Component = factory(...values);
    if (typeof Component !== "function") {
      console.warn("Canvas scene: Scene export is not a function");
      return null;
    }
    return Component as SceneComponent;
  } catch (err) {
    console.error("Canvas scene compile/exec error:", err);
    return null;
  }
}

export const CanvasSceneComponent: React.FC<{
  scene: CanvasSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion, durationFrames }) => {
  const { height } = useVideoConfig();
  const scale = width / 1080;
  const safe = useSafeArea();

  const SceneComponent = useMemo(() => {
    if (!scene.compiledJs) return null;
    return compileComponent(scene.compiledJs, buildScope());
  }, [scene.compiledJs]);

  const layout = scene.headline ? (scene.illustrationLayout ?? "illustration-top") : "fill";
  const layers = useMemo(() => ({ layers: scene.layers ?? [], scale }), [scene.layers, scale]);

  let drawing: React.ReactNode;
  if (scene.compileError) {
    drawing = <CanvasErrorState message={scene.compileError} scale={scale} />;
  } else if (!scene.compiledJs) {
    drawing = <CanvasErrorState message="Ingen kompilerad kod" scale={scale} />;
  } else if (!SceneComponent) {
    drawing = <CanvasErrorState message="Kunde inte köra scenen" scale={scale} />;
  }

  if (layout === "fill") {
    // Render the AI-generated component inside an error boundary so runtime
    // errors (e.g. bad JSX, accessing undefined props) don't crash the player.
    return (
      drawing ?? (
        <CanvasErrorBoundary scale={scale}>
          <LayersContext.Provider value={layers}>
            {SceneComponent && <SceneComponent width={width} height={height} scale={scale} safe={safe} />}
          </LayersContext.Provider>
        </CanvasErrorBoundary>
      )
    );
  }

  // Illustrationsscen: koden ritar bara i illustrationsytan, rubriken
  // renderas här — så att typografin följer Nordeas regler. Ytan ryms alltid
  // inom den säkra ytan med plats kvar för rubriken.
  const available = height - safe.top - safe.bottom;
  const illustrationHeight = Math.round(
    Math.min(
      (height * Math.min(70, Math.max(20, scene.illustrationHeightPercent ?? 48))) / 100,
      available * 0.62
    )
  );
  return (
    <IllustrationLayout
      scene={scene}
      width={width}
      motion={motion}
      durationFrames={durationFrames}
      illustrationHeight={illustrationHeight}
      illustration={
        drawing ?? (
          <CanvasErrorBoundary scale={scale}>
            <LayersContext.Provider value={layers}>
              {SceneComponent && (
                <SceneComponent width={width} height={illustrationHeight} scale={scale} safe={NO_INSETS} />
              )}
            </LayersContext.Provider>
          </CanvasErrorBoundary>
        )
      }
    />
  );
};

// ── Illustration + rubrik ──
// Layouten följer arketyperna i visual-grammar.json:
//  illustration-top    → "illustration-mitt-rubrik-under"
//  illustration-bottom → "rubrik-over-bild"
const IllustrationLayout: React.FC<{
  scene: CanvasSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
  illustrationHeight: number;
  illustration: React.ReactNode;
}> = ({ scene, width, motion, durationFrames, illustrationHeight, illustration }) => {
  const theme = useSceneTheme();
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const scale = width / 1080;
  const safe = useSafeArea();
  const m = motion ?? DEFAULT_MOTION_CONFIG;
  const endFrame = durationFrames ?? Math.round(scene.durationSeconds * FPS);
  const headlineSize = Math.round(58 * scale * headlineScale(width, height));
  const subtitleAnim = fadeSlideUp(frame, 22, 15, 20);
  const illustrationFirst = scene.illustrationLayout !== "illustration-bottom";

  const text = (
    <div style={{ padding: `0 ${100 * scale}px`, textAlign: "center" }}>
      {scene.headline && (
        <StaggeredText
          text={scene.headline}
          startFrame={6}
          endFrame={endFrame}
          fontSize={headlineSize}
          fontWeight={700}
          color={theme.headline}
          mode={m.text.stagger}
          delayBetween={m.text.delayBetween}
          useSpring={m.text.useSpring}
          fontFamily={fonts.headline}
          textAlign="center"
          lineHeight={1.15}
        />
      )}
      {scene.subtitle && (
        <RichText
          as="p"
          text={scene.subtitle}
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(34 * scale),
            fontWeight: 400,
            color: theme.text,
            margin: `${18 * scale}px 0 0`,
            lineHeight: 1.3,
            whiteSpace: "pre-line",
            ...subtitleAnim,
          }}
        />
      )}
    </div>
  );

  // overflow: hidden — ingenting från illustrationen (t.ex. mynt som faller
  // in uppifrån) kan hamna nära loggan eller i nedre marginalen.
  const drawing = (
    <div style={{ position: "relative", width, height: illustrationHeight, flexShrink: 0, overflow: "hidden" }}>
      {illustration}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Säker yta: under loggan, ovanför nedre marginalen / juridisk text.
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        gap: 36 * scale,
      }}
    >
      {illustrationFirst ? drawing : text}
      {illustrationFirst ? text : drawing}
    </AbsoluteFill>
  );
};

// ── Error boundary ──
interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; scale: number },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; scale: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("Canvas scene runtime error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <CanvasErrorState message={this.state.message || "Runtime-fel"} scale={this.props.scale} />;
    }
    return this.props.children;
  }
}

// ── Error state UI ──
const CanvasErrorState: React.FC<{ message: string; scale: number }> = ({ message, scale }) => {
  const theme = useSceneTheme();
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80 * scale,
        gap: 24 * scale,
      }}
    >
      <div
        style={{
          fontSize: Math.round(80 * scale),
          lineHeight: 1,
        }}
      >
        ⚠️
      </div>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(26 * scale),
          color: theme.text,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Canvas-scen kunde inte renderas
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(16 * scale),
          color: theme.textMuted,
          textAlign: "center",
          maxWidth: 520 * scale,
          lineHeight: 1.5,
        }}
      >
        {message}
      </span>
    </AbsoluteFill>
  );
};
