"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";

/**
 * Lightweight logo uploader for the Studio. Writes a data-URL into
 * config.logo.url via the store. Unlike components/motion-studio/LogoUploader
 * this version does NOT trigger background-removal (that's heavyweight and
 * blocks the UI); we keep that flow for the deeper editor in 8b.
 */
export function StudioLogoUploader() {
  const logo = useStudioStore((s) => s.config.logo);
  const setLogo = useStudioStore((s) => s.setLogo);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogo({ url: dataUrl, transform: logo?.transform });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => setLogo(undefined);

  if (logo?.url) {
    return (
      <div className="space-y-2">
        <div className="relative bg-nordea-deep rounded-lg p-4 flex items-center justify-center min-h-[80px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.url}
            alt="Logo"
            className="max-h-12 object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-md flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-nordea-text-tertiary hover:text-nordea-text underline"
        >
          Byt logotyp
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full p-4 border-2 border-dashed border-nordea-border rounded-lg hover:border-nordea-blue/30 hover:bg-nordea-bg-hover transition-colors"
      >
        <Upload className="w-5 h-5 text-nordea-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-nordea-text font-medium">
          Ladda upp logotyp
        </p>
        <p className="text-xs text-nordea-text-tertiary mt-1">
          PNG, SVG eller JPG
        </p>
      </button>
    </div>
  );
}
