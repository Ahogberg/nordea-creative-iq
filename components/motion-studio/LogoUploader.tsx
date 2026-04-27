"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Eraser, Image as ImageIcon } from "lucide-react";
import type { LogoConfig } from "@/lib/remotion/types";

interface LogoUploaderProps {
  logo?: LogoConfig;
  onChange: (logo: LogoConfig | undefined) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, onChange }) => {
  const [busy, setBusy] = useState<"reading" | "removing-bg" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleFile = async (file: File, removeBg: boolean) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Endast bildfiler stöds (PNG, JPG, SVG).");
      return;
    }

    // 10MB upper bound — client-side bg-removal is memory-heavy.
    if (file.size > 10 * 1024 * 1024) {
      setError("Filen är för stor (max 10 MB).");
      return;
    }

    try {
      setBusy("reading");

      let finalUrl: string;

      if (removeBg && file.type !== "image/svg+xml") {
        setBusy("removing-bg");
        // Dynamic import — the WASM bundle is ~20MB, only load when used.
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(file);
        finalUrl = await readFileAsDataUrl(new File([blob], file.name, { type: "image/png" }));
      } else {
        finalUrl = await readFileAsDataUrl(file);
      }

      onChange({
        ...(logo ?? {}),
        url: finalUrl,
        // Preserve existing transform if user previously positioned the logo
        transform: logo?.transform,
      });
    } catch (e) {
      console.error("Logo upload failed:", e);
      setError(e instanceof Error ? e.message : "Uppladdning misslyckades");
    } finally {
      setBusy(null);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerUpload = (removeBg: boolean) => {
    const input = fileInputRef.current;
    if (!input) return;
    input.dataset.removeBg = removeBg ? "1" : "0";
    input.click();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Logotyp</h3>
        {logo?.url && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-[#FC6161] flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Ta bort
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const removeBg = e.target.dataset.removeBg === "1";
          await handleFile(file, removeBg);
        }}
      />

      {logo?.url ? (
        <div>
          <div className="bg-[#EBF2FF] border border-gray-200 rounded-lg p-4 flex items-center justify-center mb-3" style={{ minHeight: 80 }}>
            <img
              src={logo.url}
              alt="Uppladdad logo"
              className="max-h-16 max-w-full object-contain"
            />
          </div>
          <p className="text-xs text-gray-500">
            Logotypen syns i alla scener. Aktivera redigeringsläget i förhandsvisningen för att flytta och skala.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => triggerUpload(false)}
            disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#0000A0] text-white text-sm font-medium hover:bg-[#000080] transition-colors disabled:opacity-50"
          >
            {busy === "reading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Ladda upp (transparent PNG/SVG)
          </button>

          <button
            type="button"
            onClick={() => triggerUpload(true)}
            disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {busy === "removing-bg" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Friläger bakgrund...
              </>
            ) : (
              <>
                <Eraser className="w-4 h-4" />
                Ladda upp + frilägg automatiskt
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-2">
            <ImageIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Frilägg kör lokalt i webbläsaren (inga bilder skickas till server).
              Första körningen laddar ~20 MB.
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-[#FC6161]">{error}</div>
      )}
    </div>
  );
};
