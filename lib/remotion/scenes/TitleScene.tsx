import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, fadeIn } from "../utils";
import { colors, fonts } from "../styles";
import type { TitleScene as TitleSceneProps } from "../types";

export const TitleSceneComponent: React.FC<{
  scene: TitleSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const headlineAnim = fadeSlideUp(frame, 8, 18, 50);
  const subtitleAnim = fadeSlideUp(frame, 22, 15, 30);
  const lineOpacity = fadeIn(frame, 15, 20);

  const isCenter = scene.alignment !== "left";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: isCenter ? "center" : "flex-start",
        padding: `0 ${110 * scale}px`,
      }}
    >
      {/* Decorative line */}
      <div
        style={{
          width: 60 * scale,
          height: 4 * scale,
          backgroundColor: colors.teal,
          borderRadius: 2 * scale,
          marginBottom: 30 * scale,
          opacity: lineOpacity,
        }}
      />

      <h1
        style={{
          fontFamily: fonts.headline,
          fontSize: Math.round(68 * scale),
          fontWeight: 900,
          color: colors.white,
          lineHeight: 1.15,
          textAlign: isCenter ? "center" : "left",
          margin: 0,
          ...headlineAnim,
        }}
      >
        {scene.headline}
      </h1>

      {scene.subtitle && (
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(32 * scale),
            fontWeight: 400,
            color: "rgba(255,255,255,0.75)",
            marginTop: 20 * scale,
            textAlign: isCenter ? "center" : "left",
            ...subtitleAnim,
          }}
        >
          {scene.subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
