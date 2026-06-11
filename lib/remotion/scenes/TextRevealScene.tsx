import React from "react";
import { AbsoluteFill } from "remotion";
import { colors, fonts } from "../styles";
import type { TextRevealScene as TextRevealSceneProps, MotionConfig, StaggerMode } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { StaggeredText } from "../animations/StaggeredText";
import { resolveBackground } from "../scene-utils";

const FPS = 30;

export const TextRevealSceneComponent: React.FC<{
  scene: TextRevealSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion, durationFrames }) => {
  const scale = width / 1080;
  const m = motion ?? DEFAULT_MOTION_CONFIG;
  const endFrame = durationFrames ?? Math.round(scene.durationSeconds * FPS);

  // Per-line stagger: each line gets its own StaggeredText starting at an
  // offset. Within a line, words/chars stagger per motion.text.stagger; if
  // the user picked "line" mode the inner stagger collapses to 'none' since
  // line-by-line is already happening at the outer level.
  const innerMode: StaggerMode = m.text.stagger === "line" ? "none" : m.text.stagger;
  const baseStartFrame = 9; // ~0.3s baseline before first line appears
  const linePerSecondGap = 0.4; // matches the legacy s2f(0.3 + i * 0.4) cadence

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: `0 ${110 * scale}px`,
      }}
    >
      {scene.lines.map((line, i) => {
        const isHighlighted = scene.highlight && line.includes(scene.highlight);
        const startFrame = baseStartFrame + Math.round(i * linePerSecondGap * FPS);

        return (
          <div key={i} style={{ marginBottom: 16 * scale }}>
            <StaggeredText
              text={line}
              startFrame={startFrame}
              endFrame={endFrame}
              fontSize={Math.round(56 * scale)}
              fontWeight={900}
              color={isHighlighted ? colors.teal : colors.white}
              mode={innerMode}
              delayBetween={m.text.delayBetween}
              useSpring={m.text.useSpring}
              fontFamily={fonts.headline}
              textAlign="left"
              lineHeight={1.3}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
