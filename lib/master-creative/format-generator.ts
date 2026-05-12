// ── Format generator ──
//
// Given a MasterCreative + a list of format ids, return one FormatVariant
// per format. Variants come from either the layout engine (auto) or from
// a saved manual override (override).

import type { VideoConfig } from "@/lib/remotion/types";
import type {
  MasterCreative,
  FormatVariant,
  FormatOverride,
} from "./types";
import type { FormatId } from "@/lib/brand/safe-zones";
import { applyFormatLayout } from "./layout-engine";

export function generateFormatVariants(
  master: MasterCreative,
  formats: FormatId[]
): FormatVariant[] {
  return formats.map((format) => {
    const override = master.format_overrides?.[format];

    if (override) {
      return {
        format,
        config: override.config,
        source: "override",
      };
    }

    return {
      format,
      config: applyFormatLayout(master.master_config, format),
      source: "auto",
    };
  });
}

export function saveFormatOverride(
  master: MasterCreative,
  format: FormatId,
  adjustedConfig: VideoConfig
): MasterCreative {
  const newOverride: FormatOverride = {
    format,
    config: adjustedConfig,
    is_manually_adjusted: true,
    override_timestamp: new Date().toISOString(),
  };

  return {
    ...master,
    format_overrides: {
      ...master.format_overrides,
      [format]: newOverride,
    },
    updated_at: new Date().toISOString(),
  };
}

export function clearFormatOverride(
  master: MasterCreative,
  format: FormatId
): MasterCreative {
  const overrides = { ...master.format_overrides };
  delete overrides[format];

  return {
    ...master,
    format_overrides: overrides,
    updated_at: new Date().toISOString(),
  };
}
