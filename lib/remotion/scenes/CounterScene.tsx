import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { counterValue, fadeSlideUp, fadeIn, scalePop, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { CounterScene as CounterSceneProps } from "../types";

export const CounterSceneComponent: React.FC<{
  scene: CounterSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const labelAnim = fadeSlideUp(frame, 5, 15, 30);
  const counterStart = s2f(0.4);
  const counterDuration = s2f(1.8);
  const value = counterValue(frame, counterStart, counterDuration, scene.fromValue, scene.toValue);
  const counterOpacity = fadeIn(frame, counterStart - 3, 10);
  const counterScale = scalePop(frame, counterStart, 22, 1.08);
  const descAnim = fadeSlideUp(frame, s2f(1.5), 15, 25);

  const formatted = scene.prefix
    ? `${scene.prefix}${Math.round(value).toLocaleString("sv-SE")}${scene.suffix || ""}`
    : `${Math.round(value).toLocaleString("sv-SE")}${scene.suffix || ""}`;

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
      {/* Label */}
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(38 * scale),
          fontWeight: 500,
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          ...labelAnim,
        }}
      >
        {scene.label}
      </div>

      {/* Counter */}
      <div
        style={{
          fontFamily: fonts.headline,
          fontSize: Math.round(120 * scale),
          fontWeight: 900,
          color: colors.white,
          marginTop: 10 * scale,
          opacity: counterOpacity,
          transform: `scale(${counterScale})`,
          whiteSpace: "nowrap",
        }}
      >
        {formatted}
      </div>

      {/* Description */}
      {scene.description && (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(32 * scale),
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            marginTop: 20 * scale,
            textAlign: "center",
            lineHeight: 1.4,
            ...descAnim,
          }}
        >
          {scene.description}
        </div>
      )}
    </AbsoluteFill>
  );
};
