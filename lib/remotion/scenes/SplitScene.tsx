import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, fadeIn, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { SplitScene as SplitSceneProps } from "../types";

export const SplitSceneComponent: React.FC<{
  scene: SplitSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const leftAnim = fadeSlideUp(frame, 8, 18, 40);
  const vsAnim = fadeIn(frame, s2f(0.6), 12);
  const rightAnim = fadeSlideUp(frame, s2f(0.9), 18, 40);
  const dividerHeight = fadeIn(frame, s2f(0.4), 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${80 * scale}px`,
        gap: 40 * scale,
      }}
    >
      {/* Left side */}
      <div style={{ flex: 1, textAlign: "center", ...leftAnim }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(26 * scale),
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 16 * scale,
          }}
        >
          {scene.leftLabel}
        </div>
        <div
          style={{
            fontFamily: fonts.headline,
            fontSize: Math.round(72 * scale),
            fontWeight: 900,
            color: colors.white,
          }}
        >
          {scene.leftValue}
        </div>
      </div>

      {/* Divider + VS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12 * scale,
        }}
      >
        <div
          style={{
            width: 2 * scale,
            height: 120 * scale * dividerHeight,
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        />
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(22 * scale),
            fontWeight: 700,
            color: colors.teal,
            opacity: vsAnim,
          }}
        >
          {scene.vsText || "VS"}
        </div>
        <div
          style={{
            width: 2 * scale,
            height: 120 * scale * dividerHeight,
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        />
      </div>

      {/* Right side */}
      <div style={{ flex: 1, textAlign: "center", ...rightAnim }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(26 * scale),
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 16 * scale,
          }}
        >
          {scene.rightLabel}
        </div>
        <div
          style={{
            fontFamily: fonts.headline,
            fontSize: Math.round(72 * scale),
            fontWeight: 900,
            color: colors.teal,
          }}
        >
          {scene.rightValue}
        </div>
      </div>
    </AbsoluteFill>
  );
};
