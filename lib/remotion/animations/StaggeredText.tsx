import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { StaggerMode } from "../types";
import { NORDEA_EASING } from "./easing";
import { SPRING_CONFIGS } from "./springs";

export type { StaggerMode };

interface StaggeredTextProps {
  text: string;
  startFrame: number;
  endFrame: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  mode?: StaggerMode;
  delayBetween?: number;
  useSpring?: boolean;
  fontFamily?: string;
  textAlign?: React.CSSProperties["textAlign"];
  lineHeight?: number;
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  text,
  startFrame,
  endFrame,
  fontSize = 56,
  fontWeight = 600,
  color = "#FFFFFF",
  mode = "word",
  delayBetween = 3,
  useSpring = false,
  fontFamily = "NordeaSansSmall, Inter, system-ui, sans-serif",
  textAlign = "center",
  lineHeight = 1.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame - 5 || frame > endFrame + 5) return null;

  const FADE_OUT = 12;
  const fadeOut = interpolate(frame, [endFrame - FADE_OUT, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (mode === "none") {
    const fadeIn = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: NORDEA_EASING.decelerate,
    });
    return (
      <p
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          color,
          textAlign,
          lineHeight,
          margin: 0,
          opacity: Math.min(fadeIn, fadeOut),
        }}
      >
        {text}
      </p>
    );
  }

  const tokens =
    mode === "word"
      ? text.split(" ")
      : mode === "character"
      ? Array.from(text)
      : text.split("\n");

  return (
    <p
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        textAlign,
        lineHeight,
        margin: 0,
        opacity: fadeOut,
        whiteSpace: "pre-wrap",
      }}
    >
      {tokens.map((token, i) => (
        <TokenAnim
          key={i}
          token={token}
          index={i}
          startFrame={startFrame}
          delayBetween={delayBetween}
          useSpring={useSpring}
          fps={fps}
          isLast={i === tokens.length - 1}
          mode={mode}
        />
      ))}
    </p>
  );
};

interface TokenAnimProps {
  token: string;
  index: number;
  startFrame: number;
  delayBetween: number;
  useSpring: boolean;
  fps: number;
  isLast: boolean;
  mode: StaggerMode;
}

const TokenAnim: React.FC<TokenAnimProps> = ({
  token,
  index,
  startFrame,
  delayBetween,
  useSpring: useSpringAnim,
  fps,
  isLast,
  mode,
}) => {
  const frame = useCurrentFrame();
  const tokenStart = startFrame + index * delayBetween;
  const animDuration = 14;
  const localFrame = Math.max(0, frame - tokenStart);

  let opacity: number;
  let translateY: number;

  if (useSpringAnim) {
    const springValue = spring({
      frame: localFrame,
      fps,
      config: SPRING_CONFIGS.gentle,
    });
    opacity = interpolate(localFrame, [0, animDuration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    translateY = interpolate(springValue, [0, 1], [12, 0]);
  } else {
    opacity = interpolate(localFrame, [0, animDuration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: NORDEA_EASING.decelerate,
    });
    translateY = interpolate(localFrame, [0, animDuration], [12, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: NORDEA_EASING.decelerate,
    });
  }

  const separator =
    mode === "word" && !isLast ? " " : mode === "line" && !isLast ? "\n" : "";

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        transform: `translateY(${translateY}px)`,
        whiteSpace: "pre",
      }}
    >
      {token}
      {separator}
    </span>
  );
};
