'use client';

import { useEffect, useRef, useState } from 'react';
import type { EyeTrackingResult } from '@/lib/ai/prompts/eye-tracking';

// ---------------------------------------------------------------------------
// HeatmapOverlay — renderar simulerad eye-tracking ovanpå ett kreativt:
//  1. bilden själv, 2. canvas-heatmap (radial gradients → färgramp),
//  3. SVG-blickbana med numrerade fixationer.
// ---------------------------------------------------------------------------

type ViewMode = 'off' | 'heatmap' | 'scanpath';

interface HeatmapOverlayProps {
  imageSrc: string;
  result: EyeTrackingResult;
  className?: string;
}

// Färgramp blå→cyan→grön→gul→röd (t 0-1)
function rampColor(t: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [0, 0, 160]],
    [0.25, [0, 180, 220]],
    [0.5, [40, 200, 80]],
    [0.75, [255, 210, 0]],
    [1.0, [230, 40, 30]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

function drawHeatmap(canvas: HTMLCanvasElement, result: EyeTrackingResult) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);

  // Pass 1: ackumulera intensitet i gråskala på offscreen-canvas
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const offCtx = off.getContext('2d');
  if (!offCtx) return;

  const paintBlob = (cx: number, cy: number, radius: number, intensity: number) => {
    const g = offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(255,255,255,${Math.min(1, intensity)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    offCtx.fillStyle = g;
    offCtx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  };

  offCtx.globalCompositeOperation = 'lighter';
  for (const r of result.regions) {
    const cx = (r.x + r.width / 2) * W;
    const cy = (r.y + r.height / 2) * H;
    const radius = Math.max((r.width * W) / 2, (r.height * H) / 2, 30) * 1.4;
    paintBlob(cx, cy, radius, r.intensity * 0.8);
  }
  for (const f of result.fixations) {
    paintBlob(f.x * W, f.y * H, Math.max(W, H) * 0.09, f.intensity * 0.7);
  }

  // Pass 2: gråskala → färgramp med alpha
  const img = offCtx.getImageData(0, 0, W, H);
  const out = ctx.createImageData(W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = img.data[i] / 255;
    if (v > 0.02) {
      const [r, g, b] = rampColor(Math.min(1, v));
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = Math.round(Math.min(1, v * 1.1) * 165); // ~0.65 max alpha
    }
  }
  ctx.putImageData(out, 0, 0);
}

export function HeatmapOverlay({ imageSrc, result, className = '' }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>('heatmap');
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Mät bildens renderade storlek och rita om vid resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width > 0 && rect.height > 0) {
        setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode === 'heatmap' && canvasRef.current && size) {
      canvasRef.current.width = size.w;
      canvasRef.current.height = size.h;
      drawHeatmap(canvasRef.current, result);
    }
  }, [mode, size, result]);

  const fixations = result.fixations.slice(0, 5);
  const pathD =
    size && fixations.length > 1
      ? fixations
          .map((f, i) => `${i === 0 ? 'M' : 'L'} ${(f.x * size.w).toFixed(1)} ${(f.y * size.h).toFixed(1)}`)
          .join(' ')
      : null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-gray-900">Simulerad eye-tracking</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#0000A0] font-medium">
            Attention {result.attention_score}/100
          </span>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(
            [
              ['off', 'Av'],
              ['heatmap', 'Heatmap'],
              ['scanpath', 'Blickbana'],
            ] as Array<[ViewMode, string]>
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 transition-colors ${
                mode === m ? 'bg-[#0000A0] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-gray-100" ref={containerRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="Annons med eye-tracking" className="w-full block" />

        {mode === 'heatmap' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none animate-in fade-in duration-700"
          />
        )}

        {mode === 'scanpath' && size && (
          <svg
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#0000A0"
                strokeWidth={2.5}
                strokeDasharray="6 5"
                opacity={0.85}
                style={{
                  strokeDashoffset: 600,
                  animation: 'ciq-dash 2.2s ease-out forwards',
                }}
              />
            )}
            {fixations.map((f, i) => {
              const r = 12 + f.intensity * 10;
              return (
                <g
                  key={f.order}
                  style={{
                    opacity: 0,
                    animation: `ciq-fix-in 0.45s ease-out forwards`,
                    animationDelay: `${i * 0.45}s`,
                  }}
                >
                  <circle cx={f.x * size.w} cy={f.y * size.h} r={r} fill="#0000A0" opacity={0.25} />
                  <circle cx={f.x * size.w} cy={f.y * size.h} r={r * 0.62} fill="#0000A0" opacity={0.9} />
                  <text
                    x={f.x * size.w}
                    y={f.y * size.h}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {f.order}
                  </text>
                </g>
              );
            })}
            <style>{`
              @keyframes ciq-dash { to { stroke-dashoffset: 0; } }
              @keyframes ciq-fix-in { from { opacity: 0; transform: scale(0.6); transform-origin: center; transform-box: fill-box; } to { opacity: 1; transform: scale(1); } }
            `}</style>
          </svg>
        )}
      </div>

      {/* Legend + attention-chips */}
      <div className="mt-4 space-y-3">
        {mode === 'heatmap' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Låg</span>
            <div
              className="h-2 flex-1 max-w-[180px] rounded-full"
              style={{
                background:
                  'linear-gradient(to right, #0000A0, #00b4dc, #28c850, #ffd200, #e6281e)',
              }}
            />
            <span>Hög uppmärksamhet</span>
          </div>
        )}

        {result.regions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[...result.regions]
              .sort((a, b) => b.attention_pct - a.attention_pct)
              .map((r, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700"
                >
                  {r.label} <span className="font-semibold text-[#0000A0]">{r.attention_pct} %</span>
                </span>
              ))}
          </div>
        )}

        {result.scan_path_summary && (
          <p className="text-sm text-gray-600">{result.scan_path_summary}</p>
        )}

        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
