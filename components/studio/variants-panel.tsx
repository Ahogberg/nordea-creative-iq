"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, RefreshCw } from "lucide-react";
import { useStudioStore, type Variant } from "@/lib/studio/store";
import { CreativeThumbnail } from "@/components/preview/creative-thumbnail";

// Vad AI:n "prövar" medan varianterna genereras — visas i skelettkorten.
const WORKING_STEPS = [
  "Läser av tonalitet och tempo…",
  "Provar en kortare rubrik…",
  "Justerar rörelse och energi…",
  "Stämmer av mot Nordeas ToV…",
];

/** `embedded`: i Motion Studios inspektör, som redan har en rubrik. */
export function VariantsPanel({ embedded = false }: { embedded?: boolean }) {
  const variants = useStudioStore((s) => s.variants);
  const isGeneratingVariants = useStudioStore((s) => s.isGeneratingVariants);
  const generateVariants = useStudioStore((s) => s.generateVariants);
  const applyVariant = useStudioStore((s) => s.applyVariant);
  const clearVariants = useStudioStore((s) => s.clearVariants);

  return (
    <div className="h-full flex flex-col">
      {embedded ? (
        variants.length > 0 && (
          <div className="px-4 pt-3 flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={clearVariants}
              className="text-xs text-nordea-text-tertiary hover:text-nordea-text"
            >
              Rensa
            </button>
          </div>
        )
      ) : (
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
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isGeneratingVariants && <GeneratingSkeletons />}

        {!isGeneratingVariants && variants.length === 0 && (
          <EmptyState onGenerate={generateVariants} />
        )}

        {variants.length > 0 &&
          variants.map((variant, i) => (
            <div
              key={variant.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 180}ms` }}
            >
              <VariantCard variant={variant} onApply={() => applyVariant(variant.id)} />
            </div>
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
      <div className="flex justify-center rounded-md bg-nordea-bg p-2 mb-3">
        <CreativeThumbnail
          config={variant.full_config}
          rounded="rounded-md"
          className={variant.full_config.format === "landscape" ? "w-full" : "h-[150px]"}
        />
      </div>
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

function GeneratingSkeletons() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % WORKING_STEPS.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-nordea-text-secondary">
        <Sparkles className="w-3.5 h-3.5 text-nordea-teal animate-pulse" />
        <span key={step} className="animate-in fade-in duration-300">{WORKING_STEPS[step]}</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-nordea-border p-3" style={{ opacity: 1 - i * 0.18 }}>
          <div className="h-[150px] rounded-md bg-gradient-to-r from-nordea-blue-soft via-nordea-teal-soft to-nordea-blue-soft bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite] mb-3" />
          <div className="h-3 rounded bg-nordea-blue-soft w-3/4 mb-2" />
          <div className="h-2.5 rounded bg-nordea-blue-soft w-1/2" />
        </div>
      ))}
    </div>
  );
}
