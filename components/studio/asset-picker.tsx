"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Image as ImageIcon,
  Video,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  fetchBrandAssets,
  BRAND_CATEGORY_FILTERS,
  type BrandAsset,
  type BrandAssetType,
} from "@/lib/brand/brand-library";

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

// Brand-library drop payload — matches what CanvasOverlay.handleDrop reads.
export interface BrandDropPayload {
  url: string;
  type: "icon" | "illustration";
  source: "brand_library";
}

interface AssetPickerProps {
  onSelect: (asset: PickedAsset) => void;
}

type Tab = "brand" | "stock" | "ai";

export function AssetPicker({ onSelect }: AssetPickerProps) {
  const [tab, setTab] = useState<Tab>("brand");

  return (
    <div className="space-y-3">
      <div className="flex bg-nordea-bg-hover rounded-md p-0.5">
        <TabButton active={tab === "brand"} onClick={() => setTab("brand")}>
          <Sparkles className="w-3.5 h-3.5" />
          Brand
        </TabButton>
        <TabButton active={tab === "stock"} onClick={() => setTab("stock")}>
          <ImageIcon className="w-3.5 h-3.5" />
          Stock
        </TabButton>
        <TabButton active={tab === "ai"} onClick={() => setTab("ai")} disabled>
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </TabButton>
      </div>

      {tab === "brand" && <BrandTab />}
      {tab === "stock" && <StockTab onSelect={onSelect} />}
      {tab === "ai" && (
        <p className="text-xs text-nordea-text-tertiary text-center py-6">
          AI-genererade illustrations kommer i nästa sprint
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors flex-1 justify-center ${
        active
          ? "bg-white text-nordea-text shadow-sm"
          : "text-nordea-text-tertiary hover:text-nordea-text"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function BrandTab() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | BrandAssetType>("all");
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBrandAssets({ query, category })
      .then((data) => {
        if (!cancelled) setAssets(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, category]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nordea-text-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök i Nordea Brand Library…"
          className="nordea-input w-full pl-9"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {BRAND_CATEGORY_FILTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              category === c.id
                ? "bg-nordea-blue text-white"
                : "bg-nordea-bg-hover text-nordea-text-tertiary hover:text-nordea-text"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-nordea-blue animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-6 text-xs text-nordea-text-tertiary">
          <p className="mb-1">Inga assets matchar.</p>
          <p className="opacity-70">
            Nordeas officiella library importeras separat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <BrandAssetTile key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-nordea-text-tertiary text-center pt-1">
        Drag till canvas eller dubbelklicka
      </p>
    </div>
  );
}

function BrandAssetTile({ asset }: { asset: BrandAsset }) {
  const dropType: BrandDropPayload["type"] =
    asset.type === "illustration" ? "illustration" : "icon";

  const payload: BrandDropPayload = {
    url: asset.url,
    type: dropType,
    source: "brand_library",
  };

  return (
    <button
      type="button"
      title={asset.name}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="aspect-square bg-white border border-nordea-border rounded-md p-2 hover:border-nordea-teal hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center justify-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.thumbnail_url}
        alt={asset.name}
        className="w-full h-full object-contain pointer-events-none"
      />
    </button>
  );
}

function StockTab({ onSelect }: { onSelect: (asset: PickedAsset) => void }) {
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
              draggable={asset.type === "photo"}
              onDragStart={(e) => {
                if (asset.type !== "photo") return;
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    url: asset.url,
                    type: "image",
                    source: "stock",
                  })
                );
              }}
              className="relative aspect-square bg-nordea-bg-hover rounded-md overflow-hidden hover:ring-2 hover:ring-nordea-blue transition-all"
              title={`Av ${asset.attribution.photographer} · ${asset.attribution.source}`}
            >
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
