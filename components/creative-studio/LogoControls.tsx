'use client';

import React from 'react';
import type { LogoConfig, LogoPosition } from '@/lib/video-types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface LogoControlsProps {
  logo: LogoConfig;
  onChange: (logo: LogoConfig) => void;
}

const POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top-center', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom-center', label: '↓' },
  { value: 'bottom-right', label: '↘' },
];

export function LogoControls({ logo, onChange }: LogoControlsProps) {
  const update = (patch: Partial<LogoConfig>) => onChange({ ...logo, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Logotyp</label>
        <Switch checked={logo.visible} onCheckedChange={(visible) => update({ visible })} />
      </div>

      {logo.visible && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Position</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => update({ position: pos.value })}
                  className={`h-8 rounded-md text-sm font-medium transition-all ${
                    logo.position === pos.value
                      ? 'bg-[#0000A0] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Storlek: {logo.size}px</Label>
            <Slider
              value={[logo.size]}
              onValueChange={([v]) => update({ size: v })}
              min={40}
              max={300}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Opacitet: {Math.round(logo.opacity * 100)}%</Label>
            <Slider
              value={[logo.opacity]}
              onValueChange={([v]) => update({ opacity: v })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </>
      )}
    </div>
  );
}
