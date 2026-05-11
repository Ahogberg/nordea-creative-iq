"use client";

import { useState } from "react";
import { Sparkles, Settings } from "lucide-react";
import {
  MOTION_PRESETS,
  getPresetDescription,
} from "@/lib/remotion/animations/presets";
import type {
  MotionConfig,
  LogoRevealStyle,
  StaggerMode,
  CtaRevealStyle,
  TransitionStyle,
  SpringName,
} from "@/lib/remotion/types";
import { MotionSlider } from "@/components/ui/motion-slider";

interface MotionPanelProps {
  motion: MotionConfig;
  onChange: (motion: MotionConfig) => void;
}

export function MotionPanel({ motion, onChange }: MotionPanelProps) {
  const [mode, setMode] = useState<"presets" | "custom">("presets");

  const applyPreset = (presetKey: string) => {
    const preset = MOTION_PRESETS[presetKey];
    if (preset) onChange(preset);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("presets")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "presets"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Presets
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "custom"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Anpassa
        </button>
      </div>

      {mode === "presets" && (
        <div className="space-y-2">
          {Object.entries(MOTION_PRESETS).map(([key, preset]) => {
            const isActive = isSameMotionConfig(motion, preset);
            return (
              <button
                type="button"
                key={key}
                onClick={() => applyPreset(key)}
                className={`w-full p-3 rounded-lg text-left border transition-colors ${
                  isActive
                    ? "bg-[#EBF2FF] border-[#0000A0]/40"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {key.replace(/_/g, " ").replace("nordea", "Nordea")}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {getPresetDescription(key)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mode === "custom" && (
        <div className="space-y-4">
          <PanelSection title="Logotyp">
            <SelectField
              label="Reveal"
              value={motion.logo.reveal}
              options={["fade", "spring", "scale", "slide-down", "none"] satisfies LogoRevealStyle[]}
              onChange={(v) =>
                onChange({ ...motion, logo: { ...motion.logo, reveal: v as LogoRevealStyle } })
              }
            />
            <MotionSlider
              value={motion.logo.duration}
              onChange={(v) =>
                onChange({ ...motion, logo: { ...motion.logo, duration: v } })
              }
              min={6}
              max={36}
              label="Duration"
              unit=" frames"
            />
          </PanelSection>

          <PanelSection title="Text">
            <SelectField
              label="Stagger"
              value={motion.text.stagger}
              options={["none", "word", "character", "line"] satisfies StaggerMode[]}
              onChange={(v) =>
                onChange({ ...motion, text: { ...motion.text, stagger: v as StaggerMode } })
              }
            />
            {motion.text.stagger !== "none" && (
              <MotionSlider
                value={motion.text.delayBetween}
                onChange={(v) =>
                  onChange({ ...motion, text: { ...motion.text, delayBetween: v } })
                }
                min={1}
                max={10}
                label="Delay mellan"
                unit=" frames"
              />
            )}
            <CheckboxField
              label="Använd spring physics"
              checked={motion.text.useSpring}
              onChange={(v) =>
                onChange({ ...motion, text: { ...motion.text, useSpring: v } })
              }
            />
          </PanelSection>

          <PanelSection title="CTA-knapp">
            <SelectField
              label="Reveal"
              value={motion.cta.reveal}
              options={["fade", "spring", "scale", "slide-up"] satisfies CtaRevealStyle[]}
              onChange={(v) =>
                onChange({ ...motion, cta: { ...motion.cta, reveal: v as CtaRevealStyle } })
              }
            />
            <SelectField
              label="Spring"
              value={motion.cta.spring}
              options={["gentle", "standard", "snappy", "bouncy", "wobbly"] satisfies SpringName[]}
              onChange={(v) =>
                onChange({ ...motion, cta: { ...motion.cta, spring: v as SpringName } })
              }
            />
          </PanelSection>

          <PanelSection title="Övergångar">
            <SelectField
              label="Stil"
              value={motion.transitions.style}
              options={["cut", "crossfade", "blur", "slide"] satisfies TransitionStyle[]}
              onChange={(v) =>
                onChange({
                  ...motion,
                  transitions: { ...motion.transitions, style: v as TransitionStyle },
                })
              }
            />
            <MotionSlider
              value={motion.transitions.duration}
              onChange={(v) =>
                onChange({ ...motion, transitions: { ...motion.transitions, duration: v } })
              }
              min={0}
              max={30}
              label="Duration"
              unit=" frames"
            />
          </PanelSection>

          <PanelSection title="Animerade siffror">
            <CheckboxField
              label="Aktivera count-up"
              checked={motion.numbers.enabled}
              onChange={(v) =>
                onChange({ ...motion, numbers: { ...motion.numbers, enabled: v } })
              }
            />
            {motion.numbers.enabled && (
              <MotionSlider
                value={motion.numbers.duration}
                onChange={(v) =>
                  onChange({ ...motion, numbers: { ...motion.numbers, duration: v } })
                }
                min={20}
                max={90}
                label="Duration"
                unit=" frames"
              />
            )}
          </PanelSection>
        </div>
      )}
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#0000A0]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-[#0000A0] focus:ring-[#0000A0]"
      />
      {label}
    </label>
  );
}

/**
 * Shallow-but-good-enough equality check for highlighting which preset is
 * currently active. Doesn't need to be perfect — false negatives just mean
 * no preset chip lights up when the user has fine-tuned a value.
 */
function isSameMotionConfig(a: MotionConfig, b: MotionConfig): boolean {
  return (
    a.logo.reveal === b.logo.reveal &&
    a.logo.duration === b.logo.duration &&
    a.text.stagger === b.text.stagger &&
    a.text.delayBetween === b.text.delayBetween &&
    a.text.useSpring === b.text.useSpring &&
    a.cta.reveal === b.cta.reveal &&
    a.cta.spring === b.cta.spring &&
    a.transitions.style === b.transitions.style &&
    a.transitions.duration === b.transitions.duration &&
    a.numbers.enabled === b.numbers.enabled &&
    a.numbers.duration === b.numbers.duration
  );
}
