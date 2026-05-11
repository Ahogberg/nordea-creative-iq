"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Layers, ChevronLeft, Loader2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";

interface MasterToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  view: "master" | "variants";
  onViewChange: (view: "master" | "variants") => void;
  masterId: string | null;
  onSaved?: (id: string) => void;
}

export function MasterToolbar({
  name,
  onNameChange,
  view,
  onViewChange,
  masterId,
  onSaved,
}: MasterToolbarProps) {
  const router = useRouter();
  const config = useStudioStore((s) => s.config);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const url = masterId ? `/api/master/${masterId}` : "/api/master";
      const method = masterId ? "PUT" : "POST";

      const body = masterId
        ? { name, master_config: config }
        : { name, source_format: config.format, master_config: config };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Save failed");
      }
      const data = await res.json();

      if (!masterId && data.master?.id) {
        onSaved?.(data.master.id);
        router.replace(`/create/master?id=${data.master.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-14 px-6 border-b border-nordea-border bg-white flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => router.push("/create")}
          className="text-nordea-text-tertiary hover:text-nordea-text flex-shrink-0"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-base font-semibold text-nordea-text bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-nordea-blue/30 rounded px-1 w-full"
            placeholder="Namnlös master"
          />
          <p className="text-xs text-nordea-text-tertiary px-1">
            Master Creative · genererar alla format automatiskt
            {error && <span className="text-nordea-rose ml-2">· {error}</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex bg-nordea-bg-hover rounded-md p-0.5">
          <button
            type="button"
            onClick={() => onViewChange("master")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              view === "master"
                ? "bg-white text-nordea-text shadow-sm"
                : "text-nordea-text-tertiary"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Master
          </button>
          <button
            type="button"
            onClick={() => onViewChange("variants")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              view === "variants"
                ? "bg-white text-nordea-text shadow-sm"
                : "text-nordea-text-tertiary"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Alla format
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="nordea-btn nordea-btn-primary nordea-btn-sm"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {masterId ? "Spara" : "Skapa master"}
        </button>
      </div>
    </div>
  );
}
