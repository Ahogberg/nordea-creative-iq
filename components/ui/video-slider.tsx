'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';

interface VideoSliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
}

export function VideoSlider({ value, onChange, min, max, step = 1, label, unit = '' }: VideoSliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between">
          <span className="text-xs text-white/50">{label}</span>
          <span className="text-xs text-white/70 font-mono">{value}{unit}</span>
        </div>
      )}
      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <SliderPrimitive.Track className="bg-white/10 relative grow rounded-full h-1">
          <SliderPrimitive.Range className="absolute bg-[#0000A0] rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block w-4 h-4 bg-white rounded-full shadow-md hover:bg-white/90 focus:outline-none" />
      </SliderPrimitive.Root>
    </div>
  );
}
