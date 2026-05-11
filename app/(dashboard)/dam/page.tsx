"use client";

import { useState } from "react";
import {
  Upload,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Library,
  Check,
  Sparkles,
  Filter,
  Plus,
  Download,
  AlertCircle,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { NordeaBadge } from "@/components/ui/nordea-badge";

// ── MOCK DATA — TODO Sprint 8 (full DAM implementation) ────────────────────
// This is a stub: layout + visuals are real, data is mock. Sprint 8
// will add the `assets` DB table + storage adapter + actual upload flow
// (Pexels/Unsplash stock search already exists in /api/ai/search-stock and
// could be the data source for now).

const MOCK_TYPES = [
  { icon: Library, label: "Alla", count: 1284, key: "all" },
  { icon: ImageIcon, label: "Bilder", count: 892, key: "image" },
  { icon: VideoIcon, label: "Video", count: 311, key: "video" },
  { icon: Music, label: "Ljud", count: 81, key: "audio" },
];

const MOCK_ASSETS = [
  { type: "image", label: "family.house.exterior", tag: "lifestyle", tone: "rgba(229,178,92,0.5)" },
  { type: "image", label: "couple.kitchen.morning", tag: "lifestyle", tone: "" },
  { type: "video", label: "aerial.stockholm.dusk", tag: "b-roll", dur: "00:18", tone: "" },
  { type: "image", label: "product.app.bolan", tag: "product", tone: "" },
  { type: "image", label: "office.advisor.smile", tag: "people", tone: "rgba(77,107,255,0.4)" },
  { type: "audio", label: "piano.warm.loop", tag: "audio", dur: "00:32", tone: "" },
  { type: "video", label: "keys.handover.macro", tag: "b-roll", dur: "00:08", tone: "" },
  { type: "image", label: "autumn.parkbench", tag: "seasonal", tone: "" },
  { type: "image", label: "dad.kid.garden", tag: "lifestyle", tone: "rgba(52,214,176,0.4)" },
  { type: "image", label: "card.tap.pos", tag: "product", tone: "" },
  { type: "video", label: "door.opening.slow", tag: "b-roll", dur: "00:12", tone: "" },
  { type: "image", label: "forest.aerial.green", tag: "sustain", tone: "" },
];

const TAGS = ["lifestyle", "product", "people", "b-roll", "audio", "seasonal", "sustain"];

export default function AssetLibraryPage() {
  const [activeType, setActiveType] = useState("all");
  const [selected, setSelected] = useState(4);

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["Mediabibliotek"]}
        right={
          <button type="button" className="nordea-btn nordea-btn-primary">
            <Upload className="w-4 h-4" />
            Ladda upp media
          </button>
        }
      />

      {/* Stub-banner */}
      <div className="px-8 pt-4">
        <div className="bg-nordea-amber-soft border border-nordea-amber/30 rounded-md px-4 py-2.5 flex items-center gap-2 text-xs text-nordea-amber">
          <AlertCircle className="w-3.5 h-3.5" />
          Stub-layout — fullt mediabibliotek (uppladdningar, semantisk sökning, AI-taggning) kommer i Sprint 8. Pexels/Unsplash-sökning fungerar via /api/ai/search-stock idag.
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr_320px] min-h-[calc(100vh-3.5rem-4rem)]">
        {/* LEFT — filters */}
        <div className="border-r border-nordea-hairline px-4.5 py-6 overflow-hidden">
          <div className="nordea-eyebrow text-[10px] mb-3">Typ</div>
          <div className="flex flex-col gap-1 mb-5">
            {MOCK_TYPES.map((t) => {
              const Icon = t.icon;
              const active = activeType === t.key;
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className={`flex items-center gap-2.5 p-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-nordea-bg-hover text-nordea-text"
                      : "text-nordea-text-secondary hover:bg-nordea-bg-hover"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left">{t.label}</span>
                  <span className="text-[11px] font-mono text-nordea-text-tertiary">{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="nordea-eyebrow text-[10px] mb-3">Källa</div>
          <div className="flex flex-col gap-2 mb-5">
            {["Varumärkesbibliotek", "Stock — Pexels", "AI-genererat", "Användaruppladdningar"].map((s, i) => (
              <label key={s} className="flex items-center gap-2 text-sm text-nordea-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={i < 2}
                  className="rounded border-nordea-border text-nordea-blue focus:ring-nordea-blue"
                />
                {s}
              </label>
            ))}
          </div>

          <div className="nordea-eyebrow text-[10px] mb-3">Taggar</div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {TAGS.map((t) => (
              <NordeaBadge key={t} tone={t === "lifestyle" ? "cobalt" : "neutral"} dot={t === "lifestyle"}>
                {t}
              </NordeaBadge>
            ))}
          </div>

          <div className="p-4 border-dashed border border-nordea-border rounded-md text-center">
            <Upload className="w-4 h-4 text-nordea-text-tertiary mx-auto mb-2" />
            <div className="text-xs text-nordea-text-secondary mb-0.5">Släpp filer här</div>
            <div className="text-[10px] text-nordea-text-tertiary">eller klicka för att bläddra</div>
          </div>
        </div>

        {/* MIDDLE — grid */}
        <div className="px-7 py-6 overflow-hidden flex flex-col">
          <div className="flex gap-2.5 mb-4 items-center">
            <div className="flex items-center gap-2 h-9 px-3 flex-1 bg-white border border-nordea-border rounded-md">
              <Sparkles className="w-3 h-3 text-nordea-teal" />
              <span className="text-sm text-nordea-text flex-1">
                aerial views of swedish nature, warm lighting
              </span>
              <NordeaBadge tone="teal">Semantisk</NordeaBadge>
            </div>
            <button className="w-9 h-9 inline-flex items-center justify-center bg-white border border-nordea-border rounded-md text-nordea-text-tertiary hover:text-nordea-text">
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex justify-between items-center mb-3.5">
            <div className="text-xs text-nordea-text-tertiary">
              <span className="text-nordea-text font-medium">1 284</span> media · sorterat efter relevans
            </div>
            <div className="flex items-center gap-2 text-xs text-nordea-text-secondary">
              <Check className="w-3 h-3 text-nordea-teal" /> 1 markerad · Lägg till i projekt
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {MOCK_ASSETS.map((a, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setSelected(i)}
                className={`relative aspect-[4/3] rounded-md overflow-hidden border transition-all ${
                  i === selected
                    ? "border-nordea-teal shadow-[0_0_0_3px_var(--nordea-teal-soft)]"
                    : "border-nordea-border hover:border-nordea-border-emphasis"
                }`}
                style={{
                  backgroundColor: a.tone || "var(--nordea-bg-hover)",
                  backgroundImage:
                    "repeating-linear-gradient(135deg, rgba(0,0,94,0.04) 0 8px, rgba(0,0,94,0.02) 8px 16px)",
                }}
              >
                <div className="absolute top-2 left-2">
                  <span
                    className={`w-4 h-4 rounded inline-flex items-center justify-center ${
                      a.type === "video"
                        ? "bg-nordea-rose-soft text-nordea-rose"
                        : a.type === "audio"
                          ? "bg-nordea-amber-soft text-nordea-amber"
                          : "bg-black/30 text-white"
                    }`}
                  >
                    {a.type === "video" ? (
                      <VideoIcon className="w-2.5 h-2.5" />
                    ) : a.type === "audio" ? (
                      <Music className="w-2.5 h-2.5" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5" />
                    )}
                  </span>
                </div>
                {i === selected && (
                  <div className="absolute top-2 right-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-nordea-teal flex items-center justify-center">
                      <Check className="w-3 h-3 text-nordea-deep" strokeWidth={2.4} />
                    </span>
                  </div>
                )}
                {a.dur && (
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {a.dur}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="text-[10px] font-mono text-white truncate">{a.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div className="border-l border-nordea-hairline px-5.5 py-6 overflow-hidden">
          <div
            className="aspect-[4/3] rounded-md mb-4"
            style={{
              backgroundColor: "rgba(77,107,255,0.4)",
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(0,0,94,0.04) 0 8px, rgba(0,0,94,0.02) 8px 16px)",
            }}
          />
          <div className="nordea-display text-lg text-nordea-deep mb-1">
            {MOCK_ASSETS[selected]?.label || "—"}
          </div>
          <div className="text-xs text-nordea-text-tertiary mb-4">
            Fotograf · Linnea Holmberg · 2025
          </div>
          <div className="flex gap-1.5 mb-5 flex-wrap">
            <NordeaBadge tone="cobalt" dot>people</NordeaBadge>
            <NordeaBadge tone="neutral">advisor</NordeaBadge>
            <NordeaBadge tone="neutral">indoor</NordeaBadge>
            <NordeaBadge tone="neutral">warm light</NordeaBadge>
            <NordeaBadge tone="green" dot>brand-cleared</NordeaBadge>
          </div>
          <div className="grid grid-cols-2 gap-0 font-mono text-xs mb-4">
            {[
              ["Format", "JPEG"],
              ["Upplösning", "4096 × 2731"],
              ["Filstorlek", "5,4 MB"],
              ["Licens", "Intern · alla"],
              ["Användning", "12 projekt"],
              ["Tillagd", "14 mar 2026"],
            ].map(([k, v], i) => (
              <div key={i} className="contents">
                <div className="text-nordea-text-tertiary py-2 border-b border-nordea-hairline">
                  {k}
                </div>
                <div className="text-nordea-text py-2 border-b border-nordea-hairline text-right">
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" className="nordea-btn nordea-btn-primary nordea-btn-full">
              <Plus className="w-4 h-4" />
              Lägg till i nuvarande projekt
            </button>
            <button type="button" className="nordea-btn nordea-btn-secondary nordea-btn-full">
              <Download className="w-4 h-4" />
              Ladda ner original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
