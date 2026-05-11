"use client";

import { Layers } from "lucide-react";
import type { FormatId } from "@/lib/brand/safe-zones";
import type { FormatOverride } from "@/lib/master-creative/types";

interface VariantGridProps {
  masterId: string | null;
  initialOverrides: Record<string, unknown>;
  onOverridesChange: (overrides: Record<FormatId, FormatOverride>) => void;
}

// Stub — fully implemented in Sprint 9.4 (next commit).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VariantGrid(_props: VariantGridProps) {
  return (
    <div className="h-full flex items-center justify-center bg-nordea-bg">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-nordea-blue-soft rounded-xl flex items-center justify-center mx-auto mb-3">
          <Layers className="w-5 h-5 text-nordea-blue" />
        </div>
        <p className="text-sm font-medium text-nordea-text mb-1">
          Variant-vyn byggs i Sprint 9.4
        </p>
        <p className="text-xs text-nordea-text-tertiary">
          Här visas alla 4 format auto-genererade från din master
        </p>
      </div>
    </div>
  );
}
