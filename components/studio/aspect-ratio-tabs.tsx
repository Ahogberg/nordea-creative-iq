"use client";

import {
  Smartphone,
  Square,
  Monitor,
  RectangleVertical,
  type LucideIcon,
} from "lucide-react";
import {
  useStudioStore,
  ASPECT_RATIOS,
  type AspectRatio,
} from "@/lib/studio/store";

const ICONS: Record<AspectRatio, LucideIcon> = {
  story: Smartphone,
  feed: Square,
  landscape: Monitor,
  vertical: RectangleVertical,
};

export function AspectRatioTabs() {
  const aspectRatio = useStudioStore((s) => s.config.format);
  const setAspectRatio = useStudioStore((s) => s.setAspectRatio);

  return (
    <div className="px-6 py-2 border-b border-nordea-hairline bg-white flex items-center gap-1 flex-shrink-0">
      {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((key) => {
        const Icon = ICONS[key];
        const config = ASPECT_RATIOS[key];
        const active = aspectRatio === key;

        return (
          <button
            type="button"
            key={key}
            onClick={() => setAspectRatio(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-nordea-blue-soft text-nordea-blue"
                : "text-nordea-text-tertiary hover:text-nordea-text hover:bg-nordea-bg-hover"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{config.label}</span>
            <span className="text-xs font-mono opacity-60">{config.ratio}</span>
          </button>
        );
      })}
    </div>
  );
}
