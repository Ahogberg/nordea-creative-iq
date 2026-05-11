// ── Master Creative types ──
//
// A Master Creative is a single VideoConfig that we project to all four
// formats (Story/Feed/Landscape/Vertical) using BRAND_SAFE_ZONES. Per-format
// manual overrides take precedence over the auto-projection.

import type { VideoConfig } from "@/lib/remotion/types";
import type { FormatId, ElementType } from "@/lib/brand/safe-zones";

export interface MasterCreative {
  id: string;
  name: string;

  // Source format — the canvas the user designed in.
  source_format: FormatId;

  // Master config (lives in source_format dimensions).
  master_config: VideoConfig;

  // Per-format manual overrides. Keys are FormatId; absent keys mean
  // "auto-generate from master_config".
  format_overrides?: Partial<Record<FormatId, FormatOverride>>;

  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FormatOverride {
  format: FormatId;
  config: VideoConfig;
  is_manually_adjusted: boolean;
  override_timestamp: string;
}

export interface FormatVariant {
  format: FormatId;
  config: VideoConfig;
  // 'auto' means the layout engine built this from master_config; 'override'
  // means the user manually adjusted it and we used the saved config verbatim.
  source: "auto" | "override";
  preview_url?: string;
  rendered_url?: string;
}

// Maps scene types to the element-types they contain. Drives which safe-zone
// rules the layout engine applies for each scene.
export const SCENE_ELEMENT_MAP: Record<string, ElementType[]> = {
  title: ["logo", "headline", "subtitle"],
  counter: ["logo", "headline", "counter"],
  cta: ["logo", "headline", "cta", "subtitle"],
  "highlight-number": ["logo", "headline", "counter"],
  "text-reveal": ["logo", "headline"],
  bars: ["logo", "headline"],
  split: ["logo", "headline"],
  "icon-grid": ["logo", "headline"],
};
