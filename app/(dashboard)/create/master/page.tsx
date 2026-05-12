"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/lib/studio/store";
import { MasterToolbar } from "@/components/master/master-toolbar";
import { MasterCanvas } from "@/components/master/master-canvas";
import { VariantGrid } from "@/components/master/variant-grid";
import { Loader2 } from "lucide-react";

function MasterPageInner() {
  const searchParams = useSearchParams();
  const masterId = searchParams.get("id");

  const [view, setView] = useState<"master" | "variants">("master");
  const [masterName, setMasterName] = useState("Namnlös master");
  const [isLoading, setIsLoading] = useState(!!masterId);
  const [formatOverrides, setFormatOverrides] = useState<Record<string, unknown>>(
    {}
  );

  useEffect(() => {
    if (!masterId) return;
    let cancelled = false;

    fetch(`/api/master/${masterId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.master) {
          useStudioStore.getState().loadConfig(data.master.master_config);
          setMasterName(data.master.name);
          setFormatOverrides(data.master.format_overrides ?? {});
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [masterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-nordea-bg">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-nordea-bg overflow-hidden">
      <MasterToolbar
        name={masterName}
        onNameChange={setMasterName}
        view={view}
        onViewChange={setView}
        masterId={masterId}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "master" ? (
          <MasterCanvas />
        ) : (
          <VariantGrid
            masterId={masterId}
            initialOverrides={formatOverrides}
            onOverridesChange={setFormatOverrides}
          />
        )}
      </div>
    </div>
  );
}

export default function MasterCreativePage() {
  return (
    <Suspense fallback={null}>
      <MasterPageInner />
    </Suspense>
  );
}
