import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useSafeArea } from "../safe-area";
import { fadeSlideUp, fadeIn, s2f } from "../utils";
import { fonts } from "../styles";
import { positionedElement, isInline, resolveBackground } from "../scene-utils";
import type { CounterScene as CounterSceneProps, MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";
import { CountingNumber } from "../animations/CountingNumber";
import { useSceneTheme } from "../theme";

const FPS = 30;

/**
 * Element IDs for per-element transforms: "label", "value", "description"
 */
export const CounterSceneComponent: React.FC<{
  scene: CounterSceneProps;
  width: number;
  motion?: MotionConfig;
  durationFrames?: number;
}> = ({ scene, width, motion }) => {
  const theme = useSceneTheme();
  const frame = useCurrentFrame();
  const scale = width / 1080;
  // Innehållet hålls inom säker yta: under loggan, ovanför nedre marginalen.
  const safe = useSafeArea();
  const m = motion ?? DEFAULT_MOTION_CONFIG;

  const labelAnim = fadeSlideUp(frame, 5, 15, 30);
  const counterStart = s2f(0.4);
  const counterOpacity = fadeIn(frame, counterStart - 3, 10);
  const descAnim = fadeSlideUp(frame, s2f(1.5), 15, 25);

  const labelNode = (
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: Math.round(38 * scale),
        fontWeight: 500,
        color: theme.textSecondary,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        ...labelAnim,
      }}
    >
      {scene.label}
    </div>
  );

  // When numbers.enabled, animate the count-up via CountingNumber.
  // When disabled, render the to-value as a static, faded-in label.
  const valueNode = m.numbers.enabled ? (
    <div style={{ marginTop: 10 * scale }}>
      <CountingNumber
        from={scene.fromValue}
        to={scene.toValue}
        startFrame={counterStart}
        durationFrames={m.numbers.duration}
        fontSize={Math.round(120 * scale)}
        fontWeight={900}
        color={theme.text}
        prefix={scene.prefix || ""}
        suffix={scene.suffix || ""}
        fontFamily={fonts.headline}
      />
    </div>
  ) : (
    <div
      style={{
        fontFamily: fonts.headline,
        fontSize: Math.round(120 * scale),
        fontWeight: 900,
        color: theme.text,
        marginTop: 10 * scale,
        opacity: counterOpacity,
        whiteSpace: "nowrap",
      }}
    >
      {`${scene.prefix || ""}${Math.round(scene.toValue).toLocaleString("sv-SE")}${scene.suffix || ""}`}
    </div>
  );

  const descNode = scene.description ? (
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: Math.round(32 * scale),
        fontWeight: 400,
        color: theme.textSecondary,
        marginTop: 20 * scale,
        textAlign: "center",
        lineHeight: 1.4,
        ...descAnim,
      }}
    >
      {scene.description}
    </div>
  ) : null;

  return (
    <AbsoluteFill
      style={{
        ...resolveBackground(scene.background),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: `${safe.top}px ${110 * scale}px ${safe.bottom}px`,
        position: "relative",
      }}
    >
      {isInline(scene, "label") && labelNode}
      {isInline(scene, "value") && valueNode}
      {isInline(scene, "description") && descNode}

      {positionedElement(scene, "label", labelNode)}
      {positionedElement(scene, "value", valueNode)}
      {descNode && positionedElement(scene, "description", descNode)}
    </AbsoluteFill>
  );
};
