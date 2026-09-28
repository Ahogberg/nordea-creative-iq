// ── Formatregister: alla format en kampanj kan levereras i ──
//
// En källa för mått, kanal, formatfamilj och leveranskrav. Video-formaten
// motsvarar VideoConfig["format"]; displayformaten är svenska publicisters
// standardformat (Panorama, Widescreen, Outsider, Mobil, MPU) och matchar
// Nordeas display-spec i lib/nordea-brand-guidelines.ts (980×240, 300×600, 300×250).
//
// Maxvikterna är utgångsvärden — publicisterna har egna specar per placering.
// Kontrollera mot mediaplanen innan leverans.

import type { VideoConfig } from "@/lib/remotion/types";

export type FormatKind = "video" | "display";

/**
 * Formatfamilj styr layouten, inte formatnamnet:
 *  strip — låg och bred (980×120): allt på en rad
 *  wide  — bred (980×240, 320×160): text vänster, bild höger
 *  box   — nästan kvadratisk (300×250, 320×320): logga, bild, text, knapp staplat
 *  tall  — hög (250×600, 300×600): luftig stapel, bild i mitten
 */
export type DisplayFamily = "strip" | "wide" | "box" | "tall";

export interface VideoFormatSpec {
  id: VideoConfig["format"];
  kind: "video";
  label: string;
  width: number;
  height: number;
  channel: string;
}

export interface DisplayFormatSpec {
  id: string;
  kind: "display";
  label: string;
  width: number;
  height: number;
  channel: string;
  family: DisplayFamily;
  /** Maxvikt för statisk bild i kB. */
  maxKb: number;
}

export type FormatSpec = VideoFormatSpec | DisplayFormatSpec;

export const VIDEO_FORMATS: VideoFormatSpec[] = [
  { id: "story", kind: "video", label: "Story / Reel 9:16", width: 1080, height: 1920, channel: "Meta, TikTok" },
  { id: "vertical", kind: "video", label: "Flöde 4:5", width: 1080, height: 1350, channel: "Meta" },
  { id: "feed", kind: "video", label: "Flöde 1:1", width: 1080, height: 1080, channel: "Meta, LinkedIn" },
  { id: "landscape", kind: "video", label: "Liggande 16:9", width: 1920, height: 1080, channel: "YouTube, webb" },
];

export const DISPLAY_FORMATS: DisplayFormatSpec[] = [
  { id: "panorama-980x240", kind: "display", label: "Panorama", width: 980, height: 240, channel: "Desktop, topp", family: "wide", maxKb: 150 },
  { id: "panorama-980x120", kind: "display", label: "Panorama låg", width: 980, height: 120, channel: "Desktop, topp", family: "strip", maxKb: 100 },
  { id: "outsider-300x600", kind: "display", label: "Outsider", width: 300, height: 600, channel: "Desktop, sida", family: "tall", maxKb: 150 },
  { id: "widescreen-250x600", kind: "display", label: "Widescreen", width: 250, height: 600, channel: "Desktop, sida", family: "tall", maxKb: 150 },
  { id: "mpu-300x250", kind: "display", label: "MPU", width: 300, height: 250, channel: "Desktop & mobil", family: "box", maxKb: 100 },
  { id: "mobil-320x320", kind: "display", label: "Mobil", width: 320, height: 320, channel: "Mobil", family: "box", maxKb: 100 },
  { id: "mobil-320x160", kind: "display", label: "Mobil låg", width: 320, height: 160, channel: "Mobil", family: "wide", maxKb: 80 },
];

export const ALL_FORMATS: FormatSpec[] = [...VIDEO_FORMATS, ...DISPLAY_FORMATS];

export function findFormat(id: string): FormatSpec | undefined {
  return ALL_FORMATS.find((f) => f.id === id);
}

export function findDisplayFormat(id: string): DisplayFormatSpec | undefined {
  return DISPLAY_FORMATS.find((f) => f.id === id);
}

/** Familj för godtyckliga mått — för format utanför registret. */
export function familyFor(width: number, height: number): DisplayFamily {
  const r = width / height;
  if (r >= 5) return "strip";
  if (r >= 1.6) return "wide";
  if (r >= 0.7) return "box";
  return "tall";
}

/** Filnamn enligt namnkonvention: kampanj_format_BxH.ext */
export function deliveryFileName(campaign: string, spec: FormatSpec, ext: string): string {
  const slug = campaign
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "kampanj";
  const name = spec.kind === "display" ? spec.id.replace(/-\d+x\d+$/, "") : spec.id;
  return `${slug}_${name}_${spec.width}x${spec.height}.${ext}`;
}
