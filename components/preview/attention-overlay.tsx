"use client";

import { useEffect, useRef, useState } from "react";

export interface AttentionPoint {
  x: number; // 0-1
  y: number; // 0-1
  radius: number; // andel av bredden
  weight: number; // 0-1
  label: string;
  order: number;
}

interface AttentionOverlayProps {
  src: string;
  points: AttentionPoint[];
  /** Bildens maxhöjd i px. */
  maxHeight?: number;
}

// Färgskala för värmen: transparent → turkos → amber → rosa (Nordea-paletten).
const STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [64, 191, 163]],
  [0.45, [64, 191, 163]],
  [0.7, [226, 189, 44]],
  [1.0, [200, 87, 92]],
];

function colorAt(v: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (v <= p1) {
      const t = (v - p0) / (p1 - p0);
      return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t)) as [number, number, number];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** Annonsbilden med uppskattad uppmärksamhet som värmekarta + blickordning. */
export function AttentionOverlay({ src, points, maxHeight = 600 }: AttentionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    // Rita i låg upplösning — värmen är mjuk ändå.
    const w = 240;
    const h = Math.round((240 * size.h) / size.w);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of points) {
      const r = Math.max(4, p.radius * w);
      const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, r);
      g.addColorStop(0, `rgba(0,0,0,${0.9 * p.weight})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // Alfa → färg
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = Math.min(1, d[i + 3] / 255);
      if (a < 0.04) {
        d[i + 3] = 0;
        continue;
      }
      const [r, gg, b] = colorAt(a);
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
      d[i + 3] = Math.round(Math.min(0.72, a * 0.9) * 255);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.putImageData(img, 0, 0);

    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [points, size]);

  const ordered = [...points].sort((a, b) => a.order - b.order);

  return (
    <div className="relative inline-block rounded-xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,94,0.3)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Annons med uppmärksamhetskarta"
        className="block max-w-full"
        style={{ maxHeight }}
        onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
      {/* Dämpa bilden lätt så att värmen syns */}
      <div className="absolute inset-0 bg-[#00005E]/25" />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}
        style={{ filter: "blur(6px)" }}
      />

      {/* Blickordning */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={ordered.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeDasharray="1.2 1"
          vectorEffect="non-scaling-stroke"
          className={`transition-opacity duration-700 delay-300 ${revealed ? "opacity-80" : "opacity-0"}`}
        />
      </svg>
      {ordered.map((p, i) => (
        <div
          key={`${p.order}-${p.label}`}
          className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-500 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transitionDelay: `${400 + i * 180}ms` }}
        >
          <span className="w-6 h-6 rounded-full bg-white text-nordea-deep text-[11px] font-bold flex items-center justify-center shadow-lg ring-2 ring-nordea-deep/10">
            {p.order}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-nordea-deep/85 text-white text-[10.5px] font-medium whitespace-nowrap backdrop-blur-sm">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
