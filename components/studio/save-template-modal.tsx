"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";

interface SaveTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Varumärke",
  "Bolån",
  "Investera",
  "Kort",
  "App",
  "HR",
  "Local",
] as const;

export function SaveTemplateModal({ open, onClose }: SaveTemplateModalProps) {
  const config = useStudioStore((s) => s.config);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    "Varumärke"
  );
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Namn krävs");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Category is prefixed into description until the templates table
    // gets its own `category` column — keeps the value preserved without a
    // schema migration this sprint.
    const composedDescription = description.trim()
      ? `[${category}] ${description.trim()}`
      : `[${category}]`;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: composedDescription,
          config,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save template");
      }

      onClose();
      setName("");
      setDescription("");
      setCategory("Varumärke");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordea-deep/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-nordea-hairline">
          <h2 className="text-lg font-semibold text-nordea-text">
            Spara som mall
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 hover:bg-nordea-bg-hover rounded-md flex items-center justify-center"
            aria-label="Stäng"
          >
            <X className="w-4 h-4 text-nordea-text-tertiary" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-nordea-text-secondary mb-1.5">
              Namn på mallen
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. 'Hero film — Bolån Q2'"
              className="nordea-input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-nordea-text-secondary mb-1.5">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof CATEGORIES)[number])
              }
              className="nordea-input w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-nordea-text-secondary mb-1.5">
              Beskrivning (valfri)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vad används mallen till? När passar den?"
              rows={3}
              className="nordea-input w-full resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-nordea-rose/10 text-nordea-rose text-sm rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-nordea-hairline">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="nordea-btn nordea-btn-primary nordea-btn-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Spara mall
          </button>
        </div>
      </div>
    </div>
  );
}
