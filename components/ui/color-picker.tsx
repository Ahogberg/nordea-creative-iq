'use client';

import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-xs text-white/50 mb-1.5">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors w-full"
      >
        <div className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: color }} />
        <span className="text-sm text-white/70 font-mono uppercase">{color}</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl">
          <HexColorPicker color={color} onChange={onChange} />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="mt-3 w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white font-mono text-center"
          />
        </div>
      )}
    </div>
  );
}
