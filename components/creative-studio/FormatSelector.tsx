'use client';

import React from 'react';
import { VIDEO_FORMATS, type VideoFormat } from '@/lib/video-types';

interface FormatSelectorProps {
  selectedFormat: VideoFormat;
  onSelect: (format: VideoFormat) => void;
}

export function FormatSelector({ selectedFormat, onSelect }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Format</label>
      <div className="grid grid-cols-2 gap-2">
        {VIDEO_FORMATS.map((format) => {
          const isSelected = format.id === selectedFormat.id;
          return (
            <button
              key={format.id}
              onClick={() => onSelect(format)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all ${
                isSelected
                  ? 'border-[#0000A0] bg-[#0000A0]/5 text-[#0000A0]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FormatIcon width={format.width} height={format.height} isSelected={isSelected} />
              <span className="font-medium text-xs">{format.label}</span>
              <span className="text-[10px] text-gray-400">{format.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormatIcon({ width, height, isSelected }: { width: number; height: number; isSelected: boolean }) {
  const maxDim = 28;
  const ratio = width / height;
  const w = ratio >= 1 ? maxDim : Math.round(maxDim * ratio);
  const h = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;

  return (
    <div
      className={`rounded-sm border ${isSelected ? 'border-[#0000A0]' : 'border-gray-300'}`}
      style={{ width: w, height: h }}
    />
  );
}
