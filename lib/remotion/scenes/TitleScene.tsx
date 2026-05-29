import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, fadeIn } from "../utils";
import { colors, fonts } from "../styles";
import { positionedElement, isInline } from "../scene-utils";
import type { TitleScene as TitleSceneProps, MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { StaggeredText } from "../animations/StaggeredText";
import { AnimatedText } from "../animations/AnimatedText";

const FPS = 30;

/**
 * Element IDs for per-element transforms:
 *   "line"     — decorative teal accent bar
 *   "headline" — main title text (renders via StaggeredText per motion.text)
 *   "subtitle" — subtitle text (optional)
 */
export const TitleSceneComponent: React.FC<{
  scene: TitleSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion, durationFrames }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;
  const m = motion ?? DEFAULT_MOTION_CONFIG;
  const endFrame = durationFrames ?? Math.round(scene.durationSeconds * FPS);

  const subtitleAnim = fadeSlideUp(frame, 22, 15, 30);
  const lineOpacity = fadeIn(frame, 15, 20);

  const isCenter = scene.alignment !== "left";

  const lineNode = (
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
  );

  const headlineNode = scene.textAnimation?.style ? (
    <AnimatedText
      text={scene.headline}
      style={scene.textAnimation.style}
      startFrame={8}
      durationFrames={scene.textAnimation.durationFrames ?? 30}
      fontStyle={{
        fontSize: Math.round(68 * scale),
        fontWeight: 900,
        color: colors.white,
        fontFamily: fonts.headline,
        textAlign: isCenter ? "center" : "left",
        lineHeight: 1.15,
      }}
    />
  ) : (
    <StaggeredText
      text={scene.headline}
      startFrame={8}
      endFrame={endFrame}
      fontSize={Math.round(68 * scale)}
      fontWeight={900}
      color={colors.white}
      mode={m.text.stagger}
      delayBetween={m.text.delayBetween}
      useSpring={m.text.useSpring}
      fontFamily={fonts.headline}
      textAlign={isCenter ? "center" : "left"}
      lineHeight={1.15}
    />
  );

  const subtitleNode = scene.subtitle ? (
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
  ) : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: isCenter ? "center" : "flex-start",
        padding: `0 ${110 * scale}px`,
        position: "relative",
      }}
    >
      {isInline(scene, "line") && lineNode}
      {isInline(scene, "headline") && headlineNode}
      {isInline(scene, "subtitle") && subtitleNode}

      {positionedElement(scene, "line", lineNode)}
      {positionedElement(scene, "headline", headlineNode)}
      {subtitleNode && positionedElement(scene, "subtitle", subtitleNode)}
    </AbsoluteFill>
  );
};
