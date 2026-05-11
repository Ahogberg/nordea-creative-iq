"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { FORMATS, type FormatId } from "@/lib/brand/safe-zones";
import type { VideoConfig } from "@/lib/remotion/types";

const MotionPlayer = dynamic(
  () =>
    import("@/lib/remotion/PlayerWrapper").then((m) => ({
      default: m.MotionPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-nordea-deep">
        <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
      </div>
    ),
  }
);

export interface PreviewVariant {
  format: FormatId;
  config: VideoConfig;
}

interface VariantPreviewCardProps {
  variant: PreviewVariant;
  size: "thumbnail" | "large";
}

export function VariantPreviewCard({
  variant,
  size,
}: VariantPreviewCardProps) {
  const dimensions = FORMATS[variant.format];

  if (size === "thumbnail") {
    return (
      <div
        className="bg-nordea-deep rounded-md overflow-hidden mx-auto"
        style={{
          aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          maxHeight: "140px",
          maxWidth: "100%",
        }}
      >
        <MotionPlayer config={variant.config} loop className="w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        aspectRatio: `${dimensions.width} / ${dimensions.height}`,
        maxHeight: "calc(100vh - 260px)",
        maxWidth: "100%",
      }}
    >
      <MotionPlayer config={variant.config} loop className="w-full h-full" />
    </div>
  );
}
