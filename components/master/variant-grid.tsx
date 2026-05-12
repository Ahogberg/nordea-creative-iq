"use client";

import { useState, useMemo, useEffect } from "react";
import { Edit, Check, Download, AlertTriangle } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { FORMATS, type FormatId } from "@/lib/brand/safe-zones";
import { applyFormatLayout, validateMasterForFormats } from "@/lib/master-creative/layout-engine";
import type { FormatOverride } from "@/lib/master-creative/types";
import type { VideoConfig } from "@/lib/remotion/types";
import { VariantPreviewCard } from "./variant-preview-card";
import { ExportAllModal } from "./export-all-modal";

const ALL_FORMATS: FormatId[] = ["story", "feed", "landscape", "vertical"];

interface VariantGridProps {
  masterId: string | null;
  initialOverrides: Record<string, unknown>;
  onOverridesChange: (overrides: Record<FormatId, FormatOverride>) => void;
}

interface VariantRow {
  format: FormatId;
  config: VideoConfig;
  isOverridden: boolean;
}

export function VariantGrid({
  masterId,
  initialOverrides,
  onOverridesChange,
}: VariantGridProps) {
  const config = useStudioStore((s) => s.config);
  const [selectedFormat, setSelectedFormat] = useState<FormatId>(config.format);
  const [overrides, setOverrides] =
    useState<Partial<Record<FormatId, FormatOverride>>>(
      (initialOverrides ?? {}) as Partial<Record<FormatId, FormatOverride>>
    );
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Sync override changes back to parent so the master record can persist them.
  useEffect(() => {
    onOverridesChange(overrides as Record<FormatId, FormatOverride>);
  }, [overrides, onOverridesChange]);

  const variants: VariantRow[] = useMemo(() => {
    return ALL_FORMATS.map((format) => {
      const override = overrides[format];
      if (override) {
        return { format, config: override.config, isOverridden: true };
      }
      return {
        format,
        config: applyFormatLayout(config, format),
        isOverridden: false,
      };
    });
  }, [config, overrides]);

  const validation = useMemo(
    () => validateMasterForFormats(config, ALL_FORMATS),
    [config]
  );

  const selectedVariant = variants.find((v) => v.format === selectedFormat);

  const clearOverride = (format: FormatId) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[format];
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-nordea-border bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-nordea-text">
            Alla format
          </h2>
          <p className="text-xs text-nordea-text-tertiary mt-0.5">
            Auto-genererat från master enligt brand-regler · klicka på
            thumbnail för att granska
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="nordea-btn nordea-btn-primary nordea-btn-sm"
        >
          <Download className="w-4 h-4" />
          Exportera alla format
        </button>
      </div>

      {validation.warnings.length > 0 && (
        <div className="px-6 py-2 bg-nordea-amber/10 border-b border-nordea-amber/20 flex items-start gap-2 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-nordea-amber flex-shrink-0 mt-0.5" />
          <div className="text-xs text-nordea-text">
            {validation.warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-nordea-bg overflow-hidden">
          {selectedVariant ? (
            <>
              <VariantPreviewCard variant={selectedVariant} size="large" />
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm font-medium text-nordea-text">
                  {FORMATS[selectedVariant.format].label} ·{" "}
                  {FORMATS[selectedVariant.format].ratio}
                </span>
                {selectedVariant.isOverridden && (
                  <button
                    type="button"
                    onClick={() => clearOverride(selectedVariant.format)}
                    className="text-xs text-nordea-blue hover:underline"
                  >
                    Återställ till auto
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-nordea-text-tertiary">Välj ett format</p>
          )}
        </div>

        <div className="w-[320px] border-l border-nordea-border bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-medium text-nordea-text-secondary uppercase tracking-wider mb-3">
              Alla 4 format
            </h3>
            <div className="space-y-2">
              {variants.map((variant) => {
                const isActive = variant.format === selectedFormat;
                return (
                  <button
                    key={variant.format}
                    type="button"
                    onClick={() => setSelectedFormat(variant.format)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-nordea-blue bg-nordea-blue-soft"
                        : "border-nordea-border hover:bg-nordea-bg-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-nordea-text">
                        {FORMATS[variant.format].label}
                      </span>
                      <span className="text-xs font-mono text-nordea-text-tertiary">
                        {FORMATS[variant.format].ratio}
                      </span>
                    </div>

                    <VariantPreviewCard variant={variant} size="thumbnail" />

                    <div className="flex items-center gap-1.5 mt-2">
                      {variant.isOverridden ? (
                        <span className="text-xs text-nordea-amber flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Manuellt justerad
                        </span>
                      ) : (
                        <span className="text-xs text-nordea-text-tertiary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Auto-genererad
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {masterId && (
              <p className="text-[11px] text-nordea-text-tertiary mt-4 px-1">
                Master sparad · ID {masterId.slice(0, 8)}
              </p>
            )}
          </div>
        </div>
      </div>

      <ExportAllModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        variants={variants.map((v) => ({ format: v.format, config: v.config }))}
      />
    </div>
  );
}
