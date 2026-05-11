"use client";

import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import { useStudioStore, type Variant } from "@/lib/studio/store";

export function VariantsPanel() {
  const variants = useStudioStore((s) => s.variants);
  const isGeneratingVariants = useStudioStore((s) => s.isGeneratingVariants);
  const generateVariants = useStudioStore((s) => s.generateVariants);
  const applyVariant = useStudioStore((s) => s.applyVariant);
  const clearVariants = useStudioStore((s) => s.clearVariants);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-nordea-hairline flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-nordea-text">
            AI-varianter
          </h3>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={clearVariants}
              className="text-xs text-nordea-text-tertiary hover:text-nordea-text"
            >
              Rensa
            </button>
          )}
        </div>
        <p className="text-xs text-nordea-text-tertiary">
          Få förslag på alternativa versioner
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isGeneratingVariants && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-nordea-blue animate-spin mb-3" />
            <p className="text-sm font-medium text-nordea-text">
              Genererar varianter…
            </p>
            <p className="text-xs text-nordea-text-tertiary mt-1">
              ~10–15 sekunder
            </p>
          </div>
        )}

        {!isGeneratingVariants && variants.length === 0 && (
          <EmptyState onGenerate={generateVariants} />
        )}

        {variants.length > 0 &&
          variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              onApply={() => applyVariant(variant.id)}
            />
          ))}

        {variants.length > 0 && !isGeneratingVariants && (
          <button
            type="button"
            onClick={generateVariants}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm w-full"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generera nya förslag
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="w-12 h-12 bg-nordea-blue-soft rounded-xl flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-nordea-blue" />
      </div>
      <p className="text-sm font-medium text-nordea-text mb-1">
        AI-varianter på din video
      </p>
      <p className="text-xs text-nordea-text-tertiary mb-4 max-w-[220px]">
        Få tre alternativa versioner med olika tonalitet och energi
      </p>
      <button
        type="button"
        onClick={onGenerate}
        className="nordea-btn nordea-btn-primary nordea-btn-sm"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Generera 3 varianter
      </button>
    </div>
  );
}

function VariantCard({
  variant,
  onApply,
}: {
  variant: Variant;
  onApply: () => void;
}) {
  return (
    <div className="bg-white border border-nordea-border rounded-lg p-3 hover:border-nordea-blue/30 transition-colors">
      <div className="text-sm font-medium text-nordea-text mb-2">
        {variant.config_diff.description}
      </div>
      <div className="space-y-1 mb-3">
        {variant.config_diff.changes.map((change, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs text-nordea-text-secondary"
          >
            <div className="w-1 h-1 bg-nordea-teal rounded-full mt-1.5 flex-shrink-0" />
            <span>{change.description}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="nordea-btn nordea-btn-secondary nordea-btn-sm w-full"
      >
        <Check className="w-3.5 h-3.5" />
        Använd denna
      </button>
    </div>
  );
}
