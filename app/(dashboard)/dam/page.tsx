"use client";

// ── Mediabibliotek ──
//
// Två riktiga källor:
//  1. Varumärkesbiblioteket — Nordeas ikoner, illustrationer och mönster
//     (lib/brand/brand-library.ts, filer i /public/brand/library).
//  2. Bildbanken — sök bild och video via /api/ai/search-stock (Pexels eller
//     Unsplash; kräver PEXELS_API_KEY eller UNSPLASH_ACCESS_KEY).
// Egna uppladdningar och AI-taggning finns inte ännu och visas därför inte.

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Library, Images, Loader2, ExternalLink, SearchX } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageHeading } from "@/components/layout/page-heading";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { NordeaBadge } from "@/components/ui/nordea-badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import {
  BRAND_CATEGORY_FILTERS,
  fetchBrandAssets,
  type BrandAsset,
  type BrandAssetType,
} from "@/lib/brand/brand-library";

type Source = "brand" | "stock";

const TYPE_LABEL: Record<BrandAssetType, string> = {
  illustration: "Illustration",
  icon: "Ikon",
  pattern: "Mönster",
  logo_variant: "Logotyp",
};

export default function AssetLibraryPage() {
  const [source, setSource] = useState<Source>("brand");

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar breadcrumb={["Mediabibliotek"]} />
      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Material"
          title="Mediabibliotek"
          description="Nordeas godkända ikoner, illustrationer och mönster — och en bildbank för foto och video."
          right={
            <SegmentedTabs<Source>
              value={source}
              onChange={setSource}
              tabs={[
                { id: "brand", label: "Varumärkesbibliotek", icon: Library },
                { id: "stock", label: "Bildbank", icon: Images },
              ]}
            />
          }
        />
        {source === "brand" ? <BrandLibrary /> : <StockLibrary />}
      </div>
    </div>
  );
}

// ── Varumärkesbiblioteket ────────────────────────────────────────────────

function BrandLibrary() {
  const [assets, setAssets] = useState<BrandAsset[] | null>(null);
  const [filter, setFilter] = useState<"all" | BrandAssetType>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandAssets().then(setAssets);
  }, []);

  const visible = useMemo(() => {
    if (!assets) return [];
    const q = query.trim().toLowerCase();
    return assets.filter(
      (a) =>
        (filter === "all" || a.type === filter) &&
        (!q || a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [assets, filter, query]);

  const selected = visible.find((a) => a.id === selectedId) ?? visible[0] ?? null;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets?.length ?? 0 };
    for (const a of assets ?? []) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [assets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
      <div className="nordea-card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nordea-text-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök på namn eller tagg, t.ex. bolån"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-nordea-border bg-white text-sm focus:outline-none focus:border-nordea-blue"
            />
          </div>
          <div className="flex gap-1">
            {BRAND_CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                  filter === f.id ? "bg-nordea-blue-soft text-nordea-blue" : "text-nordea-text-secondary hover:bg-nordea-bg-hover"
                }`}
              >
                {f.id === "illustration" ? "Illustrationer" : f.label}
                <span className="ml-1.5 text-nordea-text-tertiary tabular-nums">{counts[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {assets === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState compact icon={SearchX} title="Inget matchar sökningen" description="Prova ett annat ord eller visa alla typer." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {visible.map((a) => {
              const active = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`group text-left rounded-lg border overflow-hidden transition-colors ${
                    active ? "border-nordea-blue ring-2 ring-nordea-blue/20" : "border-nordea-hairline hover:border-nordea-border-emphasis"
                  }`}
                >
                  <div className="aspect-square bg-nordea-blue flex items-center justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element -- lokala SVG:er, ingen optimering behövs */}
                    <img src={a.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="px-3 py-2 bg-white">
                    <div className="text-xs font-medium text-nordea-text truncate">{a.name}</div>
                    <div className="text-[11px] text-nordea-text-tertiary">{TYPE_LABEL[a.type]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detaljer */}
      <div className="nordea-card p-5 lg:sticky lg:top-6">
        {selected ? (
          <>
            <div className="aspect-[4/3] rounded-lg bg-nordea-blue flex items-center justify-center p-8 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- lokala SVG:er */}
              <img src={selected.url} alt={selected.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="text-base font-semibold text-nordea-text">{selected.name}</div>
            <div className="text-xs text-nordea-text-tertiary mt-0.5">{TYPE_LABEL[selected.type]} · Nordea varumärkesbibliotek</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selected.tags.map((t) => (
                <NordeaBadge key={t} tone="neutral">
                  {t}
                </NordeaBadge>
              ))}
            </div>
            <dl className="mt-4 text-xs grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-nordea-text-tertiary">Format</dt>
              <dd className="text-right font-mono">SVG</dd>
              {selected.width && selected.height && (
                <>
                  <dt className="text-nordea-text-tertiary">Storlek</dt>
                  <dd className="text-right font-mono">
                    {selected.width} × {selected.height}
                  </dd>
                </>
              )}
              <dt className="text-nordea-text-tertiary">Användning</dt>
              <dd className="text-right">Fri inom Nordea</dd>
            </dl>
            <a href={selected.url} download className="nordea-btn nordea-btn-secondary nordea-btn-full mt-5">
              <Download className="w-4 h-4" />
              Ladda ner SVG
            </a>
          </>
        ) : (
          <p className="text-xs text-nordea-text-tertiary">Välj en fil för att se detaljer.</p>
        )}
      </div>
    </div>
  );
}

// ── Bildbanken ───────────────────────────────────────────────────────────

interface StockResult {
  id: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  type: "photo" | "video";
  attribution: { photographer: string; source: string; license: string; source_url?: string };
}

function StockLibrary() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [results, setResults] = useState<StockResult[] | null>(null);
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
        body: JSON.stringify({ query, type, per_page: 18 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 503
            ? "Bildbanken är inte kopplad. Sätt PEXELS_API_KEY eller UNSPLASH_ACCESS_KEY i miljövariablerna."
            : (body.message ?? "Sökningen misslyckades")
        );
      }
      setResults(body.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nordea-card p-5">
      <form
        className="flex flex-wrap gap-2 mb-5"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nordea-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beskriv bilden, t.ex. familj framför radhus en höstdag"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-nordea-border bg-white text-sm focus:outline-none focus:border-nordea-blue"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "photo" | "video")}
          className="h-9 px-3 rounded-md border border-nordea-border bg-white text-sm"
          aria-label="Typ"
        >
          <option value="photo">Foto</option>
          <option value="video">Video</option>
        </select>
        <button type="submit" disabled={loading || !query.trim()} className="nordea-btn nordea-btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Sök
        </button>
      </form>

      {error ? (
        <ErrorState compact title="Sökningen gick inte att göra" description={error} onRetry={search} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
          ))}
        </div>
      ) : results === null ? (
        <EmptyState
          compact
          icon={Images}
          title="Sök i bildbanken"
          description="Foto och video med licens för kommersiellt bruk. Fotografen anges på varje resultat."
        />
      ) : results.length === 0 ? (
        <EmptyState compact icon={SearchX} title="Inga träffar" description="Prova en bredare beskrivning." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {results.map((r) => (
            <a
              key={r.id}
              href={r.attribution.source_url ?? r.url}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-lg overflow-hidden border border-nordea-hairline hover:border-nordea-border-emphasis"
            >
              <div className="aspect-[4/3] bg-nordea-bg-hover overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- externa förhandsbilder från bildbanken */}
                <img src={r.preview_url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
              </div>
              <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 bg-white">
                <span className="text-[11px] text-nordea-text-secondary truncate">
                  {r.attribution.photographer} · {r.attribution.source}
                </span>
                <ExternalLink className="w-3 h-3 text-nordea-text-tertiary shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
