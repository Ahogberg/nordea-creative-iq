'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface TimelineControlsProps {
  durationInFrames: number;
  fps: number;
  onDurationChange: (frames: number) => void;
  onFpsChange: (fps: number) => void;
}

const FPS_OPTIONS = [24, 25, 30, 60];

export function TimelineControls({ durationInFrames, fps, onDurationChange, onFpsChange }: TimelineControlsProps) {
  const durationSec = (durationInFrames / fps).toFixed(1);

  return (
    <div className="space-y-4">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tidslinje</label>

      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Längd: {durationSec}s ({durationInFrames} frames)</Label>
        <Slider
          value={[durationInFrames]}
          onValueChange={([v]) => onDurationChange(v)}
          min={30}
          max={600}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-600">FPS</Label>
        <div className="flex gap-1.5">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => onFpsChange(f)}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                fps === f
                  ? 'bg-[#0000A0] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
