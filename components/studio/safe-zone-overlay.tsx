"use client";

// Visar den säkra ytan ovanpå förhandsvisningen: loggans plats, fritt område
// överst och nertill. Samma beräkning som renderaren (safeInsets/logoBox).

import { FORMAT_PRESETS, logoBox, safeInsets } from "@/lib/remotion/styles";
import { legalReserve } from "@/lib/remotion/legal";
import type { VideoConfig } from "@/lib/remotion/types";

export function SafeZoneOverlay({
  config,
  frameWidth,
  frameHeight,
}: {
  config: VideoConfig;
  frameWidth: number;
  frameHeight: number;
}) {
  const { width, height } = FORMAT_PRESETS[config.format] ?? FORMAT_PRESETS.story;
  const k = frameWidth / width;
  const safe = safeInsets(width, height, {
    showLogo: config.showLogo,
    legalReserve: legalReserve(config.legal, config.format, height),
  });
  const logo = logoBox(width, height);
  const top = safe.top * k;
  const bottom = safe.bottom * k;

  const shade = "repeating-linear-gradient(135deg, rgba(200,87,92,0.16) 0 6px, rgba(200,87,92,0.06) 6px 12px)";
  const label = "absolute left-2 text-[10px] font-medium text-white bg-nordea-rose/80 rounded px-1.5 py-0.5";

  return (
    <div className="absolute inset-0 pointer-events-none z-20" style={{ width: frameWidth, height: frameHeight }}>
      <div className="absolute left-0 right-0 top-0" style={{ height: top, background: shade }}>
        <span className={label} style={{ bottom: 4 }}>Loggan · fritt</span>
      </div>
      <div className="absolute left-0 right-0 bottom-0" style={{ height: bottom, background: shade }}>
        <span className={label} style={{ top: 4 }}>
          {config.legal?.creditWarning ? "Varningsband · fritt" : "Plattformens gränssnitt · fritt"}
        </span>
      </div>
      {config.showLogo && !config.logo?.transform && (
        <div
          className="absolute border border-dashed border-white/80 rounded-sm"
          style={{
            left: (frameWidth - logo.width * k) / 2,
            top: logo.top * k,
            width: logo.width * k,
            height: (logo.bottom - logo.top) * k,
          }}
        />
      )}
      <div
        className="absolute left-2 right-2 border border-dashed border-white/70 rounded"
        style={{ top, bottom }}
      />
    </div>
  );
}
