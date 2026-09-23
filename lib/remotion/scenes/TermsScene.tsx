import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fonts, contentTop } from "../styles";
import { resolveBackground } from "../scene-utils";
import type { TermsScene as TermsSceneProps } from "../types";
import { useSceneTheme } from "../theme";
import { RichText } from "../rich-text";

const FPS = 30;

/**
 * Villkor eller räkneexempel: centrerad liten text i vitt (på blått), första
 * raden i bold. Långa texter krymper så att de ryms. Tonar in och ut.
 */
export const TermsSceneComponent: React.FC<{
  scene: TermsSceneProps;
  width: number;
  durationFrames?: number;
}> = ({ scene, width, durationFrames }) => {
  const theme = useSceneTheme();
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const scale = width / 1080;
  const endFrame = durationFrames ?? Math.round(scene.durationSeconds * FPS);

  // Räkneexempel är långa (upp till ~900 tecken) — krymp stegvis.
  const length = (scene.heading?.length ?? 0) + scene.body.length;
  const portrait = height / width >= 1.2;
  const base = portrait ? 34 : 30;
  const fontSize = Math.round(Math.max(20, Math.min(base, base - (length - 250) / 45)) * scale);

  const opacity = Math.min(
    interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [endFrame - 10, endFrame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: `${contentTop(width, height)}px ${120 * scale}px ${40 * scale}px`,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: fonts.body,
          fontSize,
          lineHeight: 1.3,
          color: theme.text,
          textAlign: "center",
          maxWidth: 900 * scale,
        }}
      >
        {scene.heading && <div style={{ fontWeight: 700, marginBottom: fontSize * 0.2 }}>{scene.heading}</div>}
        <RichText as="div" text={scene.body} style={{ fontWeight: 400, whiteSpace: "pre-line" }} />
      </div>
    </AbsoluteFill>
  );
};
