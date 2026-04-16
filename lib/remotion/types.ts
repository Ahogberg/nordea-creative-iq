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

export interface SceneBase {
  type: SceneType;
  durationSeconds: number;
  background?: string;
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

export interface VideoConfig {
  id: string;
  title: string;
  format: "story" | "feed" | "landscape" | "vertical";
  backgroundColor: string;
  accentColor: string;
  scenes: Scene[];
  showLogo: boolean;
  totalDurationSeconds: number;
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
};
