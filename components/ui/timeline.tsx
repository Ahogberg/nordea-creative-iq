'use client';

import type { TextPlate } from '@/lib/video-types';

interface TimelineProps {
  plates: TextPlate[];
  totalFrames: number;
  fps: number;
  onPlateClick?: (id: string) => void;
  selectedPlateId?: string | null;
}

export function Timeline({ plates, totalFrames, fps, onPlateClick, selectedPlateId }: TimelineProps) {
  const ticks = Math.ceil(totalFrames / fps) + 1;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] text-white/30 font-mono px-1">
        {Array.from({ length: ticks }).map((_, i) => <span key={i}>{i}s</span>)}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-12">Logo</span>
          <div className="flex-1 h-6 bg-white/5 rounded relative">
            <div className="absolute top-0.5 bottom-0.5 left-0 right-0 bg-white/20 rounded" />
          </div>
        </div>
        {plates.map((plate, i) => {
          const left = (plate.startFrame / totalFrames) * 100;
          const width = ((plate.endFrame - plate.startFrame) / totalFrames) * 100;
          const selected = selectedPlateId === plate.id;
          return (
            <div key={plate.id} className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-12 truncate">{plate.isCta ? 'CTA' : `Text ${i + 1}`}</span>
              <div className="flex-1 h-6 bg-white/5 rounded relative">
                <button
                  onClick={() => onPlateClick?.(plate.id)}
                  className={`absolute top-0.5 bottom-0.5 rounded transition-all ${selected ? 'bg-[#0000A0]/60 ring-1 ring-[#0000A0]' : plate.isCta ? 'bg-[#0000A0]/50 hover:bg-[#0000A0]/70' : 'bg-white/20 hover:bg-white/30'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
