import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, fadeIn, scalePop, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { CtaScene as CtaSceneProps } from "../types";

export const CtaSceneComponent: React.FC<{
  scene: CtaSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const headlineAnim = fadeSlideUp(frame, 8, 18, 40);
  const subtitleAnim = fadeSlideUp(frame, 20, 15, 25);
  const buttonScale = scalePop(frame, s2f(0.8), 20, 1.06);
  const buttonOpacity = fadeIn(frame, s2f(0.7), 15);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${110 * scale}px`,
      }}
    >
      <h2
        style={{
          fontFamily: fonts.headline,
          fontSize: Math.round(60 * scale),
          fontWeight: 900,
          color: colors.white,
          textAlign: "center",
          margin: 0,
          lineHeight: 1.2,
          ...headlineAnim,
        }}
      >
        {scene.headline}
      </h2>

      {scene.subtitle && (
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(28 * scale),
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            marginTop: 20 * scale,
            textAlign: "center",
            ...subtitleAnim,
          }}
        >
          {scene.subtitle}
        </p>
      )}

      {/* CTA Button */}
      <div
        style={{
          marginTop: 50 * scale,
          backgroundColor: colors.teal,
          paddingLeft: 48 * scale,
          paddingRight: 48 * scale,
          paddingTop: 20 * scale,
          paddingBottom: 20 * scale,
          borderRadius: 50 * scale,
          opacity: buttonOpacity,
          transform: `scale(${buttonScale})`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(26 * scale),
            fontWeight: 700,
            color: colors.white,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
          }}
        >
          {scene.buttonText}
        </span>
      </div>
    </AbsoluteFill>
  );
};
