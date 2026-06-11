import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeSlideUp, s2f } from "../utils";
import { colors, fonts } from "../styles";
import { positionedElement, isInline, resolveBackground } from "../scene-utils";
import type { IconGridScene as IconGridSceneProps } from "../types";

/**
 * Element IDs for per-element transforms: "title"
 */

export const IconGridSceneComponent: React.FC<{
  scene: IconGridSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const titleAnim = fadeSlideUp(frame, 5, 15, 30);
  const cols = scene.items.length <= 4 ? 2 : 3;

  const titleNode = (
    <div
      style={{
        fontFamily: fonts.headline,
        fontSize: Math.round(48 * scale),
        fontWeight: 900,
        color: colors.white,
        marginBottom: 50 * scale,
        textAlign: "center",
        ...titleAnim,
      }}
    >
      {scene.title}
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
        padding: `0 ${80 * scale}px`,
        position: "relative",
      }}
    >
      {isInline(scene, "title") && titleNode}
      {positionedElement(scene, "title", titleNode)}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 30 * scale,
          width: "100%",
        }}
      >
        {scene.items.map((item, i) => {
          const anim = fadeSlideUp(frame, s2f(0.5 + i * 0.2), 15, 30);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: `${24 * scale}px`,
                borderRadius: 16 * scale,
                backgroundColor: "rgba(255,255,255,0.08)",
                ...anim,
              }}
            >
              <div style={{ fontSize: Math.round(56 * scale), marginBottom: 12 * scale }}>
                {item.icon}
              </div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: Math.round(24 * scale),
                  fontWeight: 600,
                  color: colors.white,
                }}
              >
                {item.label}
              </div>
              {item.value && (
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: Math.round(20 * scale),
                    fontWeight: 400,
                    color: colors.teal,
                    marginTop: 4 * scale,
                  }}
                >
                  {item.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
