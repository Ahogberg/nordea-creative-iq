import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { barGrow, fadeSlideUp, fadeIn, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { BarsScene as BarsSceneProps } from "../types";

export const BarsSceneComponent: React.FC<{
  scene: BarsSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;
  const barMaxHeight = 400 * scale;

  const titleAnim = fadeSlideUp(frame, 5, 15, 30);

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
      {scene.title && (
        <div
          style={{
            fontFamily: fonts.headline,
            fontSize: Math.round(48 * scale),
            fontWeight: 900,
            color: colors.white,
            marginBottom: 60 * scale,
            textAlign: "center",
            ...titleAnim,
          }}
        >
          {scene.title}
        </div>
      )}

      {/* Bars container */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 40 * scale,
          height: barMaxHeight + 80 * scale,
          width: "100%",
        }}
      >
        {scene.bars.map((bar, i) => {
          const startFrame = s2f(0.4 + i * 0.3);
          const targetHeight = (bar.value / bar.maxValue) * barMaxHeight;
          const currentHeight = barGrow(frame, startFrame, s2f(1.2), 0, targetHeight);
          const labelOpacity = fadeIn(frame, startFrame + s2f(0.8), 12);
          const barColor = bar.color || (i === scene.bars.length - 1 ? colors.teal : "rgba(255,255,255,0.45)");

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                maxWidth: 180 * scale,
              }}
            >
              {/* Value label */}
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: Math.round(28 * scale),
                  fontWeight: 700,
                  color: colors.white,
                  marginBottom: 10 * scale,
                  opacity: labelOpacity,
                }}
              >
                {bar.value.toLocaleString("sv-SE")}
              </div>

              {/* Bar */}
              <div
                style={{
                  width: "100%",
                  height: currentHeight,
                  backgroundColor: barColor,
                  borderRadius: `${8 * scale}px ${8 * scale}px 0 0`,
                  minHeight: 4,
                }}
              />

              {/* Label */}
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: Math.round(22 * scale),
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 12 * scale,
                  textAlign: "center",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  opacity: labelOpacity,
                }}
              >
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
