import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { TextRevealScene as TextRevealSceneProps } from "../types";

export const TextRevealSceneComponent: React.FC<{
  scene: TextRevealSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: `0 ${110 * scale}px`,
      }}
    >
      {scene.lines.map((line, i) => {
        const anim = fadeSlideUp(frame, s2f(0.3 + i * 0.4), 18, 40);
        const isHighlighted = scene.highlight && line.includes(scene.highlight);

        return (
          <div
            key={i}
            style={{
              fontFamily: fonts.headline,
              fontSize: Math.round(56 * scale),
              fontWeight: 900,
              color: isHighlighted ? colors.teal : colors.white,
              lineHeight: 1.3,
              marginBottom: 16 * scale,
              ...anim,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
