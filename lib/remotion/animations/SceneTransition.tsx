import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import type { TransitionStyle } from "../types";
import { NORDEA_EASING } from "./easing";

export type { TransitionStyle };

interface SceneTransitionProps {
  children: React.ReactNode;
  startFrame: number;
  endFrame: number;
  inTransition?: TransitionStyle;
  outTransition?: TransitionStyle;
  transitionDuration?: number;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  startFrame,
  endFrame,
  inTransition = "crossfade",
  outTransition = "crossfade",
  transitionDuration = 12,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame - 2 || frame > endFrame + 2) return null;

  // 'cut' = no transition; render the child as-is.
  if (inTransition === "cut" && outTransition === "cut") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const inProgress = interpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: NORDEA_EASING.decelerate,
    }
  );

  const outProgress = interpolate(
    frame,
    [endFrame - transitionDuration, endFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: NORDEA_EASING.accelerate,
    }
  );

  const progress = Math.min(inProgress, outProgress);

  const style: React.CSSProperties = {};

  if (inTransition === "crossfade" || outTransition === "crossfade") {
    style.opacity = progress;
  }

  if (inTransition === "blur" || outTransition === "blur") {
    const blur = (1 - progress) * 8;
    style.filter = `blur(${blur}px)`;
    style.opacity = progress;
  }

  if (inTransition === "slide") {
    const slideX = (1 - inProgress) * 50;
    style.transform = `translateX(${slideX}px)`;
    style.opacity = inProgress;
  }

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
