'use client';

import React from 'react';
import type { BackgroundConfig, BackgroundType } from '@/lib/video-types';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BackgroundControlsProps {
  background: BackgroundConfig;
  onChange: (bg: BackgroundConfig) => void;
}

const BG_TYPES: { value: BackgroundType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Bild' },
  { value: 'video', label: 'Video' },
];

export function BackgroundControls({ background, onChange }: BackgroundControlsProps) {
  const update = (patch: Partial<BackgroundConfig>) => onChange({ ...background, ...patch });

  return (
    <div className="space-y-4">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bakgrund</label>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {BG_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => update({ type: t.value })}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
              background.type === t.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {background.type === 'solid' && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Färg</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background.solidColor}
              onChange={(e) => update({ solidColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer"
            />
            <Input
              value={background.solidColor}
              onChange={(e) => update({ solidColor: e.target.value })}
              className="text-xs h-8 font-mono"
            />
          </div>
        </div>
      )}

      {background.type === 'gradient' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Start</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background.gradientStart}
                onChange={(e) => update({ gradientStart: e.target.value })}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer"
              />
              <Input
                value={background.gradientStart}
                onChange={(e) => update({ gradientStart: e.target.value })}
                className="text-xs h-8 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Slut</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background.gradientEnd}
                onChange={(e) => update({ gradientEnd: e.target.value })}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer"
              />
              <Input
                value={background.gradientEnd}
                onChange={(e) => update({ gradientEnd: e.target.value })}
                className="text-xs h-8 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Vinkel: {background.gradientAngle}°</Label>
            <Slider
              value={[background.gradientAngle]}
              onValueChange={([v]) => update({ gradientAngle: v })}
              min={0}
              max={360}
              step={1}
            />
          </div>
        </div>
      )}

      {(background.type === 'image' || background.type === 'video') && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              {background.type === 'image' ? 'Bild-URL' : 'Video-URL'}
            </Label>
            <Input
              placeholder={background.type === 'image' ? 'https://...' : 'https://...'}
              value={(background.type === 'image' ? background.imageUrl : background.videoUrl) ?? ''}
              onChange={(e) =>
                update(
                  background.type === 'image'
                    ? { imageUrl: e.target.value || null }
                    : { videoUrl: e.target.value || null }
                )
              }
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Opacitet: {Math.round(background.opacity * 100)}%</Label>
            <Slider
              value={[background.opacity]}
              onValueChange={([v]) => update({ opacity: v })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      )}
    </div>
  );
}
