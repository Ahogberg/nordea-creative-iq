"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
}

function toneFor(score: number) {
  if (score >= 80) return "var(--nordea-green)";
  if (score >= 70) return "var(--nordea-amber)";
  return "var(--nordea-rose)";
}

/** Cirkulär poängmätare som fylls upp när den visas. */
export function ScoreRing({ score, size = 120, stroke = 10, label = "av 100" }: ScoreRingProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, score))));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = toneFor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--nordea-blue-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="nordea-display text-nordea-deep tabular-nums" style={{ fontSize: size * 0.3 }}>
          {Math.round(score)}
        </span>
        <span className="text-[10px] text-nordea-text-tertiary -mt-0.5">{label}</span>
      </div>
    </div>
  );
}
