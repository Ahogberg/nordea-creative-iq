// Sprint 11A: Text animation framework.
//
// 6 styles som kompletterar existing StaggeredText (word/char/line modes
// driven från MotionConfig). De här används när scene.textAnimation.style
// är satt — annars använder scene-komponenterna fortfarande den befintliga
// StaggeredText-modulen via motion.text.

import { interpolate, Easing, spring } from "remotion";
import type { TextAnimationStyle } from "../types";

export type { TextAnimationStyle };

export interface AnimatedTextStyle {
  opacity: number;
  transform: string;
  clipPath?: string;
}

export interface AnimationContext {
  frame: number;
  fps: number;
  durationFrames: number;
  // Stagger context — defaults to 0/1 so single-piece animations work too.
  elementIndex?: number;
  totalElements?: number;
}

export function getTextAnimationStyle(
  style: TextAnimationStyle,
  ctx: AnimationContext
): AnimatedTextStyle {
  const {
    frame,
    fps,
    durationFrames,
    elementIndex = 0,
    totalElements = 1,
  } = ctx;

  // Stagger spacing: divide the first half of the duration across all pieces.
  // Capped at 6 frames so long headlines don't take forever.
  const staggerOffset = Math.min(
    6,
    Math.max(2, Math.floor(durationFrames / Math.max(1, totalElements * 3)))
  );
  const elementStartFrame = elementIndex * staggerOffset;
  const localFrame = Math.max(0, frame - elementStartFrame);

  switch (style) {
    case "fade-up": {
      const opacity = interpolate(localFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      const ty = interpolate(localFrame, [0, 20], [20, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      return { opacity, transform: `translate3d(0, ${ty}px, 0)` };
    }

    case "slide-in-left": {
      const opacity = interpolate(localFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
      });
      const tx = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.5 },
        from: -120,
        to: 0,
      });
      return { opacity, transform: `translate3d(${tx}px, 0, 0)` };
    }

    case "slide-in-right": {
      const opacity = interpolate(localFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
      });
      const tx = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.5 },
        from: 120,
        to: 0,
      });
      return { opacity, transform: `translate3d(${tx}px, 0, 0)` };
    }

    case "mask-reveal": {
      const reveal = interpolate(localFrame, [0, 25], [0, 100], {
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.6, 0.05, 0.4, 0.95),
      });
      return {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        clipPath: `inset(0 ${100 - reveal}% 0 0)`,
      };
    }

    case "typewriter": {
      // Typewriter is character-level — when called per character returns
      // 0/1 opacity based on cumulative time. Caller (AnimatedText) handles
      // the per-character timing via elementIndex.
      const charDelay = 1.5; // frames between each character
      const charStart = elementIndex * charDelay;
      const opacity = frame >= charStart ? 1 : 0;
      return { opacity, transform: "translate3d(0, 0, 0)" };
    }

    case "stagger-word":
    case "stagger-letter": {
      // Per-piece fade-up. Stagger timing handled via elementStartFrame above.
      const opacity = interpolate(localFrame, [0, 12], [0, 1], {
        extrapolateRight: "clamp",
      });
      const ty = interpolate(localFrame, [0, 18], [12, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      return { opacity, transform: `translate3d(0, ${ty}px, 0)` };
    }

    default:
      return { opacity: 1, transform: "translate3d(0, 0, 0)" };
  }
}

export function splitTextForStagger(
  text: string,
  mode: "word" | "letter"
): string[] {
  if (mode === "word") return text.split(/\s+/).filter(Boolean);
  return Array.from(text);
}

// Convenience: whether a style requires the AnimatedText splitter (word /
// letter mode) — used by render components to decide if they should bypass
// the splitter for monolithic styles.
export function isStaggerStyle(style: TextAnimationStyle): boolean {
  return (
    style === "stagger-word" ||
    style === "stagger-letter" ||
    style === "typewriter"
  );
}
