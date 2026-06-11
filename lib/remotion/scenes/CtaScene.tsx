import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp } from "../utils";
import { colors, fonts } from "../styles";
import { positionedElement, isInline, resolveBackground } from "../scene-utils";
import type { CtaScene as CtaSceneProps, MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { StaggeredText } from "../animations/StaggeredText";
import { CtaReveal } from "../animations/CtaReveal";
import { AnimatedText } from "../animations/AnimatedText";

const FPS = 30;

/**
 * Element IDs for per-element transforms: "headline", "subtitle", "button"
 */
export const CtaSceneComponent: React.FC<{
  scene: CtaSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion, durationFrames }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;
  const m = motion ?? DEFAULT_MOTION_CONFIG;
  const endFrame = durationFrames ?? Math.round(scene.durationSeconds * FPS);

  const subtitleAnim = fadeSlideUp(frame, 20, 15, 25);

  const headlineNode = scene.textAnimation?.style ? (
    <AnimatedText
      text={scene.headline}
      style={scene.textAnimation.style}
      startFrame={8}
      durationFrames={scene.textAnimation.durationFrames ?? 30}
      fontStyle={{
        fontSize: Math.round(60 * scale),
        fontWeight: 900,
        color: colors.white,
        fontFamily: fonts.headline,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    />
  ) : (
    <StaggeredText
      text={scene.headline}
      startFrame={8}
      endFrame={endFrame}
      fontSize={Math.round(60 * scale)}
      fontWeight={900}
      color={colors.white}
      mode={m.text.stagger}
      delayBetween={m.text.delayBetween}
      useSpring={m.text.useSpring}
      fontFamily={fonts.headline}
      textAlign="center"
      lineHeight={1.2}
    />
  );

  const subtitleNode = scene.subtitle ? (
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
  ) : null;

  // Button uses CtaReveal but threads the legacy pill-style colors/padding so
  // existing templates keep their shape — only the *animation* changes when
  // motion.cta.reveal/spring varies.
  const buttonNode = (
    <div style={{ marginTop: 50 * scale, display: "flex", justifyContent: "center" }}>
      <CtaReveal
        text={scene.buttonText}
        startFrame={Math.round(0.7 * FPS)}
        endFrame={endFrame}
        style={m.cta.reveal}
        springConfig={m.cta.spring}
        backgroundColor={colors.teal}
        textColor={colors.white}
        fontSize={Math.round(26 * scale)}
        fontWeight={700}
        borderRadius={50 * scale}
        paddingX={48 * scale}
        paddingY={20 * scale}
        fontFamily={fonts.body}
        letterSpacing="0.09em"
        textTransform="uppercase"
      />
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${110 * scale}px`,
        position: "relative",
      }}
    >
      {isInline(scene, "headline") && headlineNode}
      {isInline(scene, "subtitle") && subtitleNode}
      {isInline(scene, "button") && buttonNode}

      {positionedElement(scene, "headline", headlineNode)}
      {subtitleNode && positionedElement(scene, "subtitle", subtitleNode)}
      {positionedElement(scene, "button", buttonNode)}
    </AbsoluteFill>
  );
};
