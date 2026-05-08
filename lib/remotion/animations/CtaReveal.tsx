import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { CtaRevealStyle, SpringName } from "../types";
import { NORDEA_EASING } from "./easing";
import { SPRING_CONFIGS } from "./springs";

export type { CtaRevealStyle };

interface CtaRevealProps {
  text: string;
  startFrame: number;
  endFrame: number;
  style?: CtaRevealStyle;
  springConfig?: SpringName;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  fontFamily?: string;
  letterSpacing?: string | number;
  textTransform?: React.CSSProperties["textTransform"];
}

export const CtaReveal: React.FC<CtaRevealProps> = ({
  text,
  startFrame,
  endFrame,
  style = "spring",
  springConfig = "snappy",
  backgroundColor = "#40BFA3",
  textColor = "#00005E",
  fontSize = 36,
  fontWeight = 600,
  borderRadius = 8,
  paddingX = 40,
  paddingY = 18,
  fontFamily = "NordeaSansSmall, Inter, system-ui, sans-serif",
  letterSpacing = "0.02em",
  textTransform,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame - 2 || frame > endFrame + 2) return null;

  const localFrame = Math.max(0, frame - startFrame);
  const FADE_OUT = 12;
  const fadeOut = interpolate(frame, [endFrame - FADE_OUT, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let opacity = 1;
  let scale = 1;
  let translateY = 0;

  switch (style) {
    case "fade":
      opacity = interpolate(localFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      break;

    case "spring": {
      const sv = spring({
        frame: localFrame,
        fps,
        config: SPRING_CONFIGS[springConfig],
      });
      opacity = interpolate(localFrame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      scale = interpolate(sv, [0, 1], [0.85, 1]);
      break;
    }

    case "scale":
      opacity = interpolate(localFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      scale = interpolate(localFrame, [0, 18], [0.7, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.emphasized,
      });
      break;

    case "slide-up":
      opacity = interpolate(localFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      translateY = interpolate(localFrame, [0, 18], [20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: NORDEA_EASING.decelerate,
      });
      break;
  }

  return (
    <div
      style={{
        opacity: opacity * fadeOut,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        backgroundColor,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        borderRadius,
        display: "inline-block",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          color: textColor,
          letterSpacing,
          textTransform,
        }}
      >
        {text}
      </span>
    </div>
  );
};
