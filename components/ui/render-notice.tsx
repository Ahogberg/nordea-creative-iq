import { Info } from "lucide-react";

/** Visas i exportdialoger när servern inte kan rendera video (se lib/render/availability.ts). */
export function RenderNotice({ reason, className = "" }: { reason: string; className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-md border border-nordea-amber/30 bg-nordea-amber-soft px-3 py-2.5 text-xs leading-relaxed text-nordea-text ${className}`}
    >
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-nordea-amber" />
      <span>{reason}</span>
    </div>
  );
}
