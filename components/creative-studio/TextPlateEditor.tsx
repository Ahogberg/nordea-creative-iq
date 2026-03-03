'use client';

import React from 'react';
import type { TextPlate, AnimationType, FontWeight } from '@/lib/video-types';
import { generateId } from '@/lib/video-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

interface TextPlateEditorProps {
  plates: TextPlate[];
  onChange: (plates: TextPlate[]) => void;
  durationInFrames: number;
  fps: number;
}

const ANIMATIONS: { value: AnimationType; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide-up', label: 'Slide up' },
  { value: 'slide-down', label: 'Slide down' },
  { value: 'scale', label: 'Scale' },
  { value: 'none', label: 'Ingen' },
];

const FONT_WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
];

export function TextPlateEditor({ plates, onChange, durationInFrames, fps }: TextPlateEditorProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(plates[0]?.id ?? null);

  const updatePlate = (id: string, patch: Partial<TextPlate>) => {
    onChange(plates.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addPlate = () => {
    const newPlate: TextPlate = {
      id: generateId(),
      text: 'Ny text',
      fontSize: 42,
      fontWeight: 500,
      color: '#FFFFFF',
      startFrame: 0,
      endFrame: Math.min(60, durationInFrames),
      animation: 'fade',
      isCta: false,
      ctaBackgroundColor: '#0000A0',
      ctaBorderRadius: 8,
    };
    onChange([...plates, newPlate]);
    setExpandedId(newPlate.id);
  };

  const removePlate = (id: string) => {
    onChange(plates.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const frameToSec = (f: number) => (f / fps).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Textlager</label>
        <button
          onClick={addPlate}
          className="flex items-center gap-1 text-xs text-[#0000A0] hover:text-[#000080] font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Lägg till
        </button>
      </div>

      <div className="space-y-2">
        {plates.map((plate, index) => {
          const isExpanded = expandedId === plate.id;
          return (
            <div key={plate.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : plate.id)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="text-xs font-medium text-gray-700 truncate flex-1">
                  {plate.isCta && (
                    <span className="inline-block bg-[#0000A0] text-white text-[9px] px-1.5 py-0.5 rounded mr-1.5 font-semibold">
                      CTA
                    </span>
                  )}
                  {plate.text || `Lager ${index + 1}`}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {frameToSec(plate.startFrame)}s–{frameToSec(plate.endFrame)}s
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                  <div className="pt-3 space-y-2">
                    <Label className="text-xs text-gray-600">Text</Label>
                    <Input
                      value={plate.text}
                      onChange={(e) => updatePlate(plate.id, { text: e.target.value })}
                      className="text-sm h-8"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Storlek: {plate.fontSize}px</Label>
                      <Slider
                        value={[plate.fontSize]}
                        onValueChange={([v]) => updatePlate(plate.id, { fontSize: v })}
                        min={16}
                        max={120}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Vikt</Label>
                      <select
                        value={plate.fontWeight}
                        onChange={(e) => updatePlate(plate.id, { fontWeight: Number(e.target.value) as FontWeight })}
                        className="w-full h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
                      >
                        {FONT_WEIGHTS.map((fw) => (
                          <option key={fw.value} value={fw.value}>{fw.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Färg</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={plate.color}
                          onChange={(e) => updatePlate(plate.id, { color: e.target.value })}
                          className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={plate.color}
                          onChange={(e) => updatePlate(plate.id, { color: e.target.value })}
                          className="text-xs h-7 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Animation</Label>
                      <select
                        value={plate.animation}
                        onChange={(e) => updatePlate(plate.id, { animation: e.target.value as AnimationType })}
                        className="w-full h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
                      >
                        {ANIMATIONS.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">
                      Timing: {frameToSec(plate.startFrame)}s – {frameToSec(plate.endFrame)}s
                    </Label>
                    <Slider
                      value={[plate.startFrame, plate.endFrame]}
                      onValueChange={([start, end]) => updatePlate(plate.id, { startFrame: start, endFrame: end })}
                      min={0}
                      max={durationInFrames}
                      step={1}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plate.isCta}
                        onCheckedChange={(checked) => updatePlate(plate.id, { isCta: checked })}
                      />
                      <Label className="text-xs text-gray-600">CTA-knapp</Label>
                    </div>
                    <button
                      onClick={() => removePlate(plate.id)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Ta bort
                    </button>
                  </div>

                  {plate.isCta && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Knappfärg</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={plate.ctaBackgroundColor}
                            onChange={(e) => updatePlate(plate.id, { ctaBackgroundColor: e.target.value })}
                            className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                          />
                          <Input
                            value={plate.ctaBackgroundColor}
                            onChange={(e) => updatePlate(plate.id, { ctaBackgroundColor: e.target.value })}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Radie: {plate.ctaBorderRadius}px</Label>
                        <Slider
                          value={[plate.ctaBorderRadius]}
                          onValueChange={([v]) => updatePlate(plate.id, { ctaBorderRadius: v })}
                          min={0}
                          max={32}
                          step={1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
