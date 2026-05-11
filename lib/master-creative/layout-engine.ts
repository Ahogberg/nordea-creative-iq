// ── Layout engine ──
//
// Projects a master VideoConfig onto a target format using BRAND_SAFE_ZONES.
// Stores per-element layout hints on each scene so a future renderer can
// read them and position elements without touching the master config.
//
// The existing Remotion render pipeline doesn't consume these hints yet —
// this is scaffolding so the variant grid + multi-format export pipeline
// have something coherent to carry forward.

import type { VideoConfig, Scene } from "@/lib/remotion/types";
import {
  FORMATS,
  computePosition,
  type FormatId,
  type ElementSafeZone,
  type ElementType,
} from "@/lib/brand/safe-zones";
import { SCENE_ELEMENT_MAP } from "./types";

// Layout hints we attach to each scene. The renderer can opt-in to reading
// these without breaking scenes that lack them (everything is optional).
export type SceneLayoutHints = Partial<Record<ElementType, ElementSafeZone>>;
export type SceneWithLayout = Scene & { layout?: SceneLayoutHints };

export function applyFormatLayout(
  masterConfig: VideoConfig,
  targetFormat: FormatId
): VideoConfig {
  // Deep clone via structured copy so callers can mutate the master config
  // without affecting variants (and vice versa).
  const variantConfig: VideoConfig = JSON.parse(JSON.stringify(masterConfig));

  variantConfig.format = targetFormat;
  variantConfig.scenes = variantConfig.scenes.map((scene) =>
    applySceneLayout(scene, targetFormat)
  );

  return variantConfig;
}

function applySceneLayout(scene: Scene, format: FormatId): SceneWithLayout {
  const elementTypes = SCENE_ELEMENT_MAP[scene.type] ?? [];
  const layout: SceneLayoutHints = {};

  for (const elementType of elementTypes) {
    const { safeZone } = computePosition(format, elementType);
    layout[elementType] = safeZone;
  }

  return { ...scene, layout };
}

export interface MasterValidation {
  valid: boolean;
  warnings: string[];
}

// Flags rough overflow risks (e.g. headlines too long for Story). Not
// authoritative — meant as soft hints in the variant grid, not blockers.
export function validateMasterForFormats(
  masterConfig: VideoConfig,
  formats: FormatId[]
): MasterValidation {
  const warnings: string[] = [];

  for (const format of formats) {
    const dims = FORMATS[format];
    for (const scene of masterConfig.scenes) {
      if (scene.type === "title" || scene.type === "cta") {
        const headline = scene.headline;
        if (
          dims.width / dims.height < 1 && // portrait formats
          typeof headline === "string" &&
          headline.length > 60
        ) {
          warnings.push(
            `Scen "${headline.slice(0, 30)}…" kan vara för lång för ${dims.label} (${dims.ratio})`
          );
        }
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}
