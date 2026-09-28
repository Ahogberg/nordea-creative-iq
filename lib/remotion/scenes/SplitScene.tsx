import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useSafeArea } from "../safe-area";
import { fadeSlideUp, fadeIn, s2f } from "../utils";
import { colors, fonts } from "../styles";
import { resolveBackground, inlineElement, positionedElement } from "../scene-utils";
import type { SplitScene as SplitSceneProps } from "../types";
import { useSceneTheme } from "../theme";

export const SplitSceneComponent: React.FC<{
  scene: SplitSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const theme = useSceneTheme();
  const frame = useCurrentFrame();
  const scale = width / 1080;
  // Innehållet hålls inom säker yta: under loggan, ovanför nedre marginalen.
  const safe = useSafeArea();

  const leftAnim = fadeSlideUp(frame, 8, 18, 40);
  const vsAnim = fadeIn(frame, s2f(0.6), 12);
  const rightAnim = fadeSlideUp(frame, s2f(0.9), 18, 40);
  const dividerHeight = fadeIn(frame, s2f(0.4), 20);

  // Tre flyttbara delar: "left", "divider" och "right". Sidorna delar på
  // bredden (flex: 1) — den ligger på omslaget så att layouten är oförändrad.
  const leftNode = (
    <div style={{ textAlign: "center", ...leftAnim }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(26 * scale),
          fontWeight: 500,
          color: theme.textSecondary,
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
          color: theme.text,
        }}
      >
        {scene.leftValue}
      </div>
    </div>
  );

  const dividerNode = (
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
          backgroundColor: theme.hairline,
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
          backgroundColor: theme.hairline,
        }}
      />
    </div>
  );

  const rightNode = (
    <div style={{ textAlign: "center", ...rightAnim }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(26 * scale),
          fontWeight: 500,
          color: theme.textSecondary,
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
  );

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: `${safe.top}px ${80 * scale}px ${safe.bottom}px`,
        gap: 40 * scale,
      }}
    >
      {inlineElement(scene, "left", leftNode, { flex: 1 })}
      {inlineElement(scene, "divider", dividerNode)}
      {inlineElement(scene, "right", rightNode, { flex: 1 })}

      {positionedElement(scene, "left", leftNode)}
      {positionedElement(scene, "divider", dividerNode)}
      {positionedElement(scene, "right", rightNode)}
    </AbsoluteFill>
  );
};
