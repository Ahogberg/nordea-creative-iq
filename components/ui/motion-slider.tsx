"use client";

import * as React from "react";
import { Slider as BaseSlider } from "./slider";

interface MotionSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
}

/**
 * Thin wrapper around the radix-based Slider that exposes a number-only API
 * (the radix one uses arrays and onValueChange). Used in the Motion Studio
 * MotionPanel — keeping this separate from the canonical Slider so other
 * call-sites that need the radix API are unaffected.
 */
export function MotionSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit,
}: MotionSliderProps) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-500">{label}</label>
          <span className="text-xs text-gray-700 font-medium tabular-nums">
            {value}
            {unit ?? ""}
          </span>
        </div>
      )}
      <BaseSlider
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
