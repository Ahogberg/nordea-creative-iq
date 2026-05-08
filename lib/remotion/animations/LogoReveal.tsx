import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img } from "remotion";
import type { ElementTransform, LogoRevealStyle } from "../types";
import { colors, fonts } from "../styles";
import { NORDEA_EASING } from "./easing";
import { SPRING_CONFIGS } from "./springs";

export type { LogoRevealStyle };

export type LogoPositionPreset =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface LogoRevealProps {
  /** Animation style applied to opacity/scale/translate. */
  style?: LogoRevealStyle;
  /** Image url. If undefined, renders the "N + Nordea" text lockup fallback. */
  src?: string;
  /** Frame at which the reveal starts. */
  startFrame?: number;
  /** Frames the reveal animation runs for. */
  durationFrames?: number;
  /** Canvas width — required for proportional scaling. */
  videoWidth: number;
  /** Free positioning (used by Motion Studio's LogoEditor). Overrides `position`. */
  transform?: ElementTransform;
  /** Preset corner used when no transform is supplied. */
  position?: LogoPositionPreset;
  /** Logo width override. Defaults to 15% of canvas width. */
  size?: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({
  style = "spring",
  src,
  startFrame = 0,
  durationFrames = 18,
  videoWidth,
  transform,
  position = "top-center",
  size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - startFrame);

  // ── Animation ──
  let opacity = 1;
  let scale = 1;
  let translateY = 0;

  switch (style) {
    case "fade":
      opacity = interpolate(localFrame, [0, durationFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      break;

    case "spring": {
      const springValue = spring({
        frame: localFrame,
        fps,
        config: SPRING_CONFIGS.standard,
      });
      opacity = interpolate(localFrame, [0, durationFrames * 0.6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      scale = interpolate(springValue, [0, 1], [0.92, 1]);
      break;
    }

    case "scale":
      opacity = interpolate(localFrame, [0, durationFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.standard,
      });
      scale = interpolate(localFrame, [0, durationFrames], [0.7, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.emphasized,
      });
      break;

    case "slide-down":
      opacity = interpolate(localFrame, [0, durationFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      translateY = interpolate(localFrame, [0, durationFrames], [-30, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      break;

    case "none":
      break;
  }

  // ── Positioning ──
  const widthScale = videoWidth / 1080;
  const baseSize = size ?? videoWidth * 0.15;
  const renderScale = transform?.scale ?? 1;
  const logoWidthPx = baseSize * renderScale;

  // Compose extra transform (scale * rotation from logo.transform) so it
  // multiplies with the animation transform instead of overwriting it.
  const rotationDeg = transform?.rotation ?? 0;
  const animationTransform = `scale(${scale}) translateY(${translateY}px)`;

  let positionStyle: React.CSSProperties;
  if (transform) {
    // Free positioning — center on (x, y) fractions of canvas.
    positionStyle = {
      position: "absolute",
      left: `${(transform.x ?? 0.5) * 100}%`,
      top: `${(transform.y ?? 0.05) * 100}%`,
      transform: `translate(-50%, -50%) rotate(${rotationDeg}deg) ${animationTransform}`,
      width: logoWidthPx,
      opacity,
      zIndex: 100,
    };
  } else {
    // Preset corner positioning.
    const padding = 60 * widthScale;
    const bottomOffset = padding + 100 * widthScale;
    const corner: Record<LogoPositionPreset, React.CSSProperties> = {
      "top-left": { top: padding, left: padding },
      "top-center": { top: padding, left: "50%", transform: `translateX(-50%) ${animationTransform}` },
      "top-right": { top: padding, right: padding },
      "bottom-left": { bottom: bottomOffset, left: padding },
      "bottom-center": { bottom: bottomOffset, left: "50%", transform: `translateX(-50%) ${animationTransform}` },
      "bottom-right": { bottom: bottomOffset, right: padding },
    };
    const cornerStyles = corner[position];
    positionStyle = {
      position: "absolute",
      width: logoWidthPx,
      opacity,
      zIndex: 100,
      transform: animationTransform,
      ...cornerStyles,
    };
  }

  return <div style={positionStyle}>{src ? renderImage(src) : renderLockup(widthScale)}</div>;
};

function renderImage(src: string): React.ReactNode {
  return (
    <Img
      src={src}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}

// Reuses the legacy "N + Nordea" lockup from DynamicVideo's LogoOverlay so
// motion-driven logo reveals keep the same fallback look as the existing
// non-animated overlay.
function renderLockup(widthScale: number): React.ReactNode {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12 * widthScale,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 44 * widthScale,
          height: 44 * widthScale,
          borderRadius: 10 * widthScale,
          backgroundColor: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.headline,
          fontSize: Math.round(26 * widthScale),
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
          fontSize: Math.round(28 * widthScale),
          fontWeight: 700,
          color: colors.white,
          letterSpacing: "0.04em",
        }}
      >
        Nordea
      </span>
    </div>
  );
}
