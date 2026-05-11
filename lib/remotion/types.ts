// ── Motion Studio Video Configuration Types ──
// These types define the JSON config that Claude generates from user prompts

export type SceneType =
  | "title"
  | "counter"
  | "bars"
  | "text-reveal"
  | "icon-grid"
  | "cta"
  | "split"
  | "highlight-number"
  | "lottie"
  | "canvas";

// Transform applied to a draggable/resizable element on the canvas.
// x/y are fractions of canvas width/height (0-1). scale is a multiplier
// around the element's natural size. rotation is in degrees.
export interface ElementTransform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
}

export interface SceneBase {
  type: SceneType;
  durationSeconds: number;
  background?: string;
  // Per-element transforms keyed by element id ("headline", "value", "cta", etc).
  // Scenes that support draggable elements read from this to place them.
  elementTransforms?: Record<string, ElementTransform>;
}

export interface TitleScene extends SceneBase {
  type: "title";
  headline: string;
  subtitle?: string;
  alignment?: "center" | "left";
}

export interface CounterScene extends SceneBase {
  type: "counter";
  label: string;
  fromValue: number;
  toValue: number;
  suffix?: string;
  prefix?: string;
  description?: string;
}

export interface BarsScene extends SceneBase {
  type: "bars";
  title?: string;
  bars: Array<{
    label: string;
    value: number;
    maxValue: number;
    color?: string;
  }>;
}

export interface TextRevealScene extends SceneBase {
  type: "text-reveal";
  lines: string[];
  highlight?: string;
}

export interface IconGridScene extends SceneBase {
  type: "icon-grid";
  title: string;
  items: Array<{
    icon: string; // emoji or unicode
    label: string;
    value?: string;
  }>;
}

export interface CtaScene extends SceneBase {
  type: "cta";
  headline: string;
  buttonText: string;
  subtitle?: string;
}

export interface SplitScene extends SceneBase {
  type: "split";
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  vsText?: string;
}

export interface HighlightNumberScene extends SceneBase {
  type: "highlight-number";
  number: string;
  label: string;
  description?: string;
  accentColor?: string;
}

export interface CanvasScene extends SceneBase {
  type: "canvas";
  // TSX source — AI-generated component body. Human-readable.
  tsxCode: string;
  // Compiled JS (set server-side). Client executes this via scoped Function.
  compiledJs?: string;
  // Compile error, if any (set server-side when compilation fails)
  compileError?: string;
  // Short description of what the scene shows — used for UI labels
  description?: string;
}

export interface LottieScene extends SceneBase {
  type: "lottie";
  // Either animationId (preferred — resolved from curated library)
  // or animationUrl (direct URL to a Lottie JSON)
  animationId?: string;
  animationUrl?: string;
  headline?: string;
  caption?: string;
  // Size of the animation as a percentage of canvas width (default 60)
  sizePercent?: number;
  // Vertical position: "top" | "center" | "bottom" (default "center")
  position?: "top" | "center" | "bottom";
  // Loop playback within the scene (default true)
  loop?: boolean;
  // Playback speed multiplier (default 1)
  playbackSpeed?: number;
}

export type Scene =
  | TitleScene
  | CounterScene
  | BarsScene
  | TextRevealScene
  | IconGridScene
  | CtaScene
  | SplitScene
  | HighlightNumberScene
  | LottieScene
  | CanvasScene;

export interface LogoConfig {
  // Public/data URL of the uploaded logo image (PNG/SVG, ideally transparent)
  url?: string;
  // Position + size of the logo overlay. Defaults to top-center if omitted.
  transform?: ElementTransform;
}

// ── Sprint 4: Motion Polish ──
//
// MotionConfig describes the "Nordea Motion Language" applied across a video.
// Lives on VideoConfig so the render pipeline reads it verbatim from a saved
// template. All fields are required *inside* the object — backward compat is
// handled at integration points by `?? DEFAULT_MOTION_CONFIG`.
//
// String unions are duplicated in animations/* component prop types — keep
// them in sync. (We avoid importing component prop types here to prevent
// circular imports between types.ts and the animation .tsx files.)

export type LogoRevealStyle = "fade" | "spring" | "scale" | "slide-down" | "none";
export type StaggerMode = "word" | "character" | "line" | "none";
export type CtaRevealStyle = "fade" | "spring" | "scale" | "slide-up";
export type TransitionStyle = "cut" | "crossfade" | "blur" | "slide";
export type SpringName = "gentle" | "standard" | "snappy" | "bouncy" | "wobbly";

export interface MotionConfig {
  logo: {
    reveal: LogoRevealStyle;
    duration: number;
  };
  text: {
    stagger: StaggerMode;
    delayBetween: number;
    useSpring: boolean;
  };
  cta: {
    reveal: CtaRevealStyle;
    spring: SpringName;
  };
  transitions: {
    style: TransitionStyle;
    duration: number;
  };
  numbers: {
    enabled: boolean;
    duration: number;
  };
}

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  logo: { reveal: "spring", duration: 18 },
  text: { stagger: "word", delayBetween: 3, useSpring: false },
  cta: { reveal: "spring", spring: "snappy" },
  transitions: { style: "crossfade", duration: 12 },
  numbers: { enabled: true, duration: 45 },
};

export interface VideoConfig {
  id: string;
  title: string;
  format: "story" | "feed" | "landscape" | "vertical";
  quality?: "hd" | "4k";
  backgroundColor: string;
  accentColor: string;
  scenes: Scene[];
  showLogo: boolean;
  logo?: LogoConfig;
  totalDurationSeconds: number;
  // Sprint 4: Motion Polish. Optional for backward compatibility — older
  // templates without the field fall back to DEFAULT_MOTION_CONFIG at the
  // integration points (DynamicVideo, scene components, MotionPanel).
  motion?: MotionConfig;
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  id: "default",
  title: "Ny video",
  format: "story",
  backgroundColor: "#0000A0",
  accentColor: "#40BFA3",
  scenes: [
    {
      type: "title",
      durationSeconds: 2.5,
      headline: "Nordea CreativeIQ",
      subtitle: "Motion Studio",
      alignment: "center",
    },
    {
      type: "counter",
      durationSeconds: 3,
      label: "KONTANTINSATS",
      fromValue: 0,
      toValue: 250000,
      suffix: " kr",
      description: "Så mycket kan du spara",
    },
    {
      type: "cta",
      durationSeconds: 2,
      headline: "Kom igång idag",
      buttonText: "LÄS MER PÅ NORDEA.SE",
      subtitle: "Vi hjälper dig hela vägen",
    },
  ],
  showLogo: true,
  totalDurationSeconds: 7.5,
  motion: DEFAULT_MOTION_CONFIG,
};
