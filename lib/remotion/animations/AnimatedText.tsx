import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  getTextAnimationStyle,
  splitTextForStagger,
  isStaggerStyle,
  type TextAnimationStyle,
} from "./TextAnimations";
import {
  hasRichMarkup,
  parseRichText,
  renderRichTokens,
  tokenizeRichText,
  RICH_REGULAR_WEIGHT,
} from "../rich-text";

interface Props {
  text: string;
  style: TextAnimationStyle;
  startFrame?: number;
  durationFrames?: number;
  fontStyle?: React.CSSProperties;
  className?: string;
}

// Sprint 11A: Text component that resolves a TextAnimationStyle into the
// right per-piece animation. Used by scene components when scene.textAnimation
// is set — otherwise scenes keep their existing StaggeredText (from
// MotionConfig.text). Backwards-compatible by design.
export const AnimatedText: React.FC<Props> = ({
  text,
  style,
  startFrame = 0,
  durationFrames = 30,
  fontStyle,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  // `**fet**`-markup: löptext i regular, nyckelord i bold.
  const rich = hasRichMarkup(text);
  const baseStyle: React.CSSProperties = rich
    ? { ...fontStyle, fontWeight: RICH_REGULAR_WEIGHT }
    : { ...fontStyle };

  if (isStaggerStyle(style)) {
    const splitMode: "word" | "letter" =
      style === "stagger-word" ? "word" : "letter";
    // Typewriter is character-level too.
    const pieces = rich
      ? tokenizeRichText(text, splitMode === "word" && style !== "typewriter" ? "word" : "character")
      : splitTextForStagger(text, style === "typewriter" ? "letter" : splitMode).map(
          (t) => [{ text: t, bold: false }]
        );
    // Rich-ord bär sitt mellanslag själva; vanliga ord får ett efteråt.
    const addSpace = !rich && style === "stagger-word";

    return (
      <div
        className={className}
        style={{
          ...baseStyle,
          display: "inline-block",
          // Allow line breaks at spaces in stagger-word
          whiteSpace: "pre-wrap",
        }}
      >
        {pieces.map((piece, i) => {
          const s = getTextAnimationStyle(style, {
            frame: localFrame,
            fps,
            durationFrames,
            elementIndex: i,
            totalElements: pieces.length,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: s.opacity,
                transform: s.transform,
                whiteSpace: "pre",
              }}
            >
              {renderRichTokens(piece)}
              {addSpace && i < pieces.length - 1 ? " " : null}
            </span>
          );
        })}
      </div>
    );
  }

  const s = getTextAnimationStyle(style, {
    frame: localFrame,
    fps,
    durationFrames,
  });
  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        opacity: s.opacity,
        transform: s.transform,
        clipPath: s.clipPath,
        whiteSpace: "pre-line",
      }}
    >
      {rich ? renderRichTokens(parseRichText(text)) : text}
    </div>
  );
};
