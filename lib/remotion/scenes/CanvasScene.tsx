import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  random,
} from "remotion";
import { colors, fonts } from "../styles";
import * as animUtils from "../utils";
import type { CanvasScene as CanvasSceneProps } from "../types";

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
  spring,
  useVideoConfig,
  random,
  colors,
  fonts,
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
});

type ScopeRecord = ReturnType<typeof buildScope>;
type SceneComponent = React.FC<{ width: number; height: number; scale: number }>;

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
}> = ({ scene, width }) => {
  const { height } = useVideoConfig();
  const scale = width / 1080;

  const SceneComponent = useMemo(() => {
    if (!scene.compiledJs) return null;
    return compileComponent(scene.compiledJs, buildScope());
  }, [scene.compiledJs]);

  if (scene.compileError) {
    return <CanvasErrorState message={scene.compileError} scale={scale} />;
  }

  if (!scene.compiledJs) {
    return <CanvasErrorState message="Ingen kompilerad kod" scale={scale} />;
  }

  if (!SceneComponent) {
    return <CanvasErrorState message="Kunde inte köra scenen" scale={scale} />;
  }

  // Render the AI-generated component inside an error boundary so runtime
  // errors (e.g. bad JSX, accessing undefined props) don't crash the player.
  return (
    <CanvasErrorBoundary scale={scale}>
      <SceneComponent width={width} height={height} scale={scale} />
    </CanvasErrorBoundary>
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
          color: colors.white,
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
          color: colors.dimText,
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
