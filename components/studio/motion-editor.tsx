"use client";

import { useStudioStore } from "@/lib/studio/store";
import { Label } from "@/components/ui/label";
import { MOTION_PRESETS } from "@/lib/remotion/animations/presets";
import { DEFAULT_MOTION_CONFIG } from "@/lib/remotion/types";

const PRESET_META: Record<string, { label: string; desc: string }> = {
  nordea_standard: { label: "Standard", desc: "Balanserad och varm" },
  energetic: { label: "Energisk", desc: "Snabb och dynamisk" },
  calm: { label: "Lugn", desc: "Mjuk och stadig" },
  minimal: { label: "Minimal", desc: "Subtil och rent" },
  premium: { label: "Premium", desc: "Polerad och lyxig" },
};

/**
 * Picks one of the curated MOTION_PRESETS from lib/remotion/animations/presets
 * and writes the full MotionConfig to the store (rather than a preset key)
 * so existing scenes can read motion fields directly without an extra
 * lookup.
 */
export function MotionEditor() {
  const motion =
    useStudioStore((s) => s.config.motion) ?? DEFAULT_MOTION_CONFIG;
  const updateMotion = useStudioStore((s) => s.updateMotion);

  // Try to detect which preset matches the current motion config by
  // comparing logo.reveal + text.stagger + transitions.style — three
  // distinctive axes.
  const activePresetKey = Object.entries(MOTION_PRESETS).find(
    ([, preset]) =>
      preset.logo.reveal === motion.logo.reveal &&
      preset.text.stagger === motion.text.stagger &&
      preset.transitions.style === motion.transitions.style
  )?.[0];

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Motion-stil</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {Object.entries(MOTION_PRESETS).map(([key, preset]) => {
            const meta = PRESET_META[key] ?? { label: key, desc: "" };
            const active = activePresetKey === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => updateMotion(preset)}
                className={`p-2 rounded-md text-left text-xs transition-colors border ${
                  active
                    ? "bg-nordea-blue-soft border-nordea-blue/30 text-nordea-blue"
                    : "bg-white border-nordea-border text-nordea-text-secondary hover:bg-nordea-bg-hover"
                }`}
              >
                <div className="font-medium">{meta.label}</div>
                <div className="text-[10px] text-nordea-text-tertiary mt-0.5">
                  {meta.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
