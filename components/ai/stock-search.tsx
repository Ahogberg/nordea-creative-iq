"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";

interface StockResult {
  id: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  type: "photo" | "video";
  attribution: {
    photographer: string;
    source: string;
    license: string;
    source_url?: string;
  };
}

interface StockSearchProps {
  onSelect: (result: StockResult) => void;
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type, per_page: 12 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body.message ??
            (res.status === 503
              ? "Ingen stock-provider konfigurerad — sätt PEXELS_API_KEY eller UNSPLASH_ACCESS_KEY"
              : "Sökningen misslyckades")
        );
        setResults([]);
        return;
      }

      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Okänt fel");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
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
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "photo" | "video")}
          className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
        >
          <option value="photo">Foto</option>
          <option value="video">Video</option>
        </select>
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[#40BFA3] hover:bg-[#40BFA3]/80 text-[#00005E] rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Sök
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-amber-200">{error}</span>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-white/[0.03] border border-white/[0.06] rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {results.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-white/[0.06] hover:border-white/20 transition-colors"
              title={`${item.attribution.photographer} · ${item.attribution.source}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview_url}
                alt={`Stock ${item.type} av ${item.attribution.photographer}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
                <span className="opacity-0 group-hover:opacity-100 text-[11px] text-white/90 truncate">
                  © {item.attribution.photographer} · {item.attribution.source}
                </span>
              </div>
              {item.type === "video" && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-medium text-white uppercase">
                  Video
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-sm text-white/40 text-center py-8">
          Inga resultat för "{query}". Prova andra sökord.
        </div>
      )}
    </div>
  );
}
