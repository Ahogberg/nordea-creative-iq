import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";
import type { ElementTransform, LogoRevealStyle } from "../types";
import { LOGO_ASPECT } from "../styles";
import { NORDEA_EASING } from "./easing";
import { SPRING_CONFIGS } from "./springs";
import { useSceneTheme, type SceneTheme } from "../theme";

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
  /** Image url. If undefined, renders Nordea's wordmark in the scene's text colour. */
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
  /** Avstånd från toppen (px) för top-center. Standard 60 px × skala. */
  topOffset?: number;
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
  topOffset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useSceneTheme();
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
      "top-center": { top: topOffset ?? padding, left: "50%", transform: `translateX(-50%) ${animationTransform}` },
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

  return <div style={positionStyle}>{src ? renderImage(src) : renderWordmark(theme)}</div>;
};

/**
 * Nordeas ordmärke (public/images/nordea-logo-neg.png) färgat efter scenen:
 * PNG:n används som mask så att samma fil blir vit på blått och Nordea-blå på
 * ljusa scener. Den osynliga <Img> gör att Remotion väntar tills filen laddats.
 */
function renderWordmark(theme: SceneTheme): React.ReactNode {
  const src = staticFile("images/nordea-logo-neg.png");
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${LOGO_ASPECT}` }}>
      <Img src={src} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: theme.text,
          WebkitMask: mask,
          mask,
        }}
      />
    </div>
  );
}

function renderImage(src: string): React.ReactNode {
  return (
    <Img
      src={src}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}
