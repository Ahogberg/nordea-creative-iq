import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, fadeIn, scalePop, s2f } from "../utils";
import { colors, fonts } from "../styles";
import type { HighlightNumberScene as HighlightNumberSceneProps, MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { CountingNumber } from "../animations/CountingNumber";

export const HighlightNumberSceneComponent: React.FC<{
  scene: HighlightNumberSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;
  const m = motion ?? DEFAULT_MOTION_CONFIG;

  const labelAnim = fadeSlideUp(frame, 5, 15, 30);
  const numberScale = scalePop(frame, 12, 22, 1.1);
  const numberOpacity = fadeIn(frame, 10, 12);
  const descAnim = fadeSlideUp(frame, s2f(1.0), 15, 25);
  const accent = scene.accentColor || colors.teal;

  // Glow ring behind the number
  const ringScale = fadeIn(frame, 8, 25);

  // Try to parse scene.number as a numeric value. The field is typed as string
  // so we may get "5%", "10.5", or "miljon" — only count up if it parses cleanly.
  const numericValue = parseNumericNumber(scene.number);
  const useCountUp = m.numbers.enabled && numericValue !== null;

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
          fontSize: Math.round(30 * scale),
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 30 * scale,
          ...labelAnim,
        }}
      >
        {scene.label}
      </div>

      {/* Glow circle */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 320 * scale,
            height: 320 * scale,
            borderRadius: "50%",
            border: `3px solid ${accent}`,
            opacity: ringScale * 0.4,
            transform: `scale(${0.8 + ringScale * 0.2})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 380 * scale,
            height: 380 * scale,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            opacity: ringScale * 0.15,
            transform: `scale(${0.7 + ringScale * 0.3})`,
          }}
        />

        {/* Number — count-up when numeric, otherwise fall back to static scale-pop */}
        {useCountUp ? (
          <div style={{ position: "relative", zIndex: 1 }}>
            <CountingNumber
              from={0}
              to={numericValue}
              startFrame={10}
              durationFrames={m.numbers.duration}
              fontSize={Math.round(140 * scale)}
              fontWeight={900}
              color={accent}
              fontFamily={fonts.headline}
              suffix={extractSuffix(scene.number)}
            />
          </div>
        ) : (
          <div
            style={{
              fontFamily: fonts.headline,
              fontSize: Math.round(140 * scale),
              fontWeight: 900,
              color: accent,
              opacity: numberOpacity,
              transform: `scale(${numberScale})`,
              position: "relative",
              zIndex: 1,
            }}
          >
            {scene.number}
          </div>
        )}
      </div>

      {/* Description */}
      {scene.description && (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(30 * scale),
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            marginTop: 40 * scale,
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: 700 * scale,
            ...descAnim,
          }}
        >
          {scene.description}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Parse the leading numeric prefix from a string like "5%", "10.5", or "1 200".
 * Returns null if the string starts with a non-digit (e.g. "miljon"), in which
 * case the caller should render statically rather than try to count up.
 */
function parseNumericNumber(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const match = cleaned.match(/^-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) ? num : null;
}

function extractSuffix(value: string): string {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const match = cleaned.match(/^-?\d+(\.\d+)?/);
  if (!match) return "";
  return value.replace(match[0], "").trimStart();
}
