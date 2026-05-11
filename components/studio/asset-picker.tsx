"use client";

import { useState } from "react";
import { Search, Image as ImageIcon, Video, Loader2 } from "lucide-react";

export interface PickedAsset {
  id: string;
  url: string;
  preview_url: string;
  type: "photo" | "video";
  attribution: {
    photographer: string;
    source: string;
    license: string;
    source_url: string;
  };
}

interface AssetPickerProps {
  onSelect: (asset: PickedAsset) => void;
}

export function AssetPicker({ onSelect }: AssetPickerProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [results, setResults] = useState<PickedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), type, per_page: 12 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 503) {
          setError("Stock-leverantör ej konfigurerad");
        } else {
          setError(body?.message || "Sökning misslyckades");
        }
        setResults([]);
        return;
      }

      const data = (await res.json()) as { results: PickedAsset[] };
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nordea-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Sök stock-bilder/video…"
            className="nordea-input w-full pl-9"
          />
        </div>
        <div className="flex bg-nordea-bg-hover rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setType("photo")}
            aria-label="Foton"
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              type === "photo"
                ? "bg-white text-nordea-text shadow-sm"
                : "text-nordea-text-tertiary"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setType("video")}
            aria-label="Videor"
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              type === "video"
                ? "bg-white text-nordea-text shadow-sm"
                : "text-nordea-text-tertiary"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-nordea-blue animate-spin" />
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-nordea-rose text-center py-3">{error}</p>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {results.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset)}
              className="relative aspect-square bg-nordea-bg-hover rounded-md overflow-hidden hover:ring-2 hover:ring-nordea-blue transition-all"
              title={`Av ${asset.attribution.photographer} · ${asset.attribution.source}`}
            >
              {/* Stock previews are tiny and short-lived; next/image overhead isn't worth it here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.preview_url}
                alt=""
                className="w-full h-full object-cover"
              />
              {asset.type === "video" && (
                <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                  VIDEO
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <p className="text-xs text-nordea-text-tertiary text-center py-4">
          Inga resultat. Prova andra sökord.
        </p>
      )}
    </div>
  );
}
