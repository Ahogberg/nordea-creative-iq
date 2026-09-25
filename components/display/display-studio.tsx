"use client";

// Displayformat: videons budskap i svenska publicisters displayformat.
// Allt visas i verklig storlek bredvid varandra; regelkontrollen körs per
// format medan man skriver. Rendering ger riktiga filer med vikt, och
// leveranspaketet är en ZIP med bilder och specifikation.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Thumbnail } from "@remotion/player";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  Check,
  ImageOff,
  Image as ImageIcon,
  Scan,
  RotateCcw,
} from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { DISPLAY_FORMATS, type DisplayFormatSpec } from "@/lib/formats/registry";
import { DisplayBanner, type DisplayBannerProps } from "@/lib/display/DisplayBanner";
import { displayContentFromVideo } from "@/lib/display/from-video";
import { layoutDisplay } from "@/lib/display/layout";
import { lintDisplay, type DisplayIssue } from "@/lib/display/lint";
import { resolveContent, type DisplayContent, type DisplayOverride, type DisplaySet } from "@/lib/display/types";
import { HTML5_TARGETS, type Html5Target } from "@/lib/display/html5/build";
import { useHtml5Banners, type Html5Pair } from "@/lib/display/html5/use-html5";

const FPS = 30;

const BACKGROUNDS = [
  { hex: "#0000A0", label: "Nordea-blå" },
  { hex: "#FFFFFF", label: "Vit" },
  { hex: "#FBD9CA", label: "Persika" },
  { hex: "#DCEDFF", label: "Ljusblå" },
];

interface RenderedInfo {
  src: string;
  bytes: number;
  maxKb: number;
  withinLimit: boolean;
  mime: string;
  issues: DisplayIssue[];
}

function freshSet(name: string, content: DisplayContent): DisplaySet {
  return { name, content, formats: DISPLAY_FORMATS.map((f) => f.id), overrides: {} };
}

export function DisplayStudio() {
  const config = useStudioStore((s) => s.config);
  const display = useStudioStore((s) => s.display);
  const setDisplay = useStudioStore((s) => s.setDisplay);

  // Första besöket: hämta budskapet ur videon.
  useEffect(() => {
    if (!display) setDisplay(freshSet(config.title || "Kampanj", displayContentFromVideo(config)));
  }, [display, config, setDisplay]);

  const [selected, setSelected] = useState<string | null>(null);
  const [rendered, setRendered] = useState<Record<string, RenderedInfo>>({});
  const [busy, setBusy] = useState<"render" | "export" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(false);
  const [mode, setMode] = useState<"static" | "html5">("static");
  const [target, setTarget] = useState<Html5Target>("iab");
  const [clickUrl, setClickUrl] = useState("https://www.nordea.se");
  const [replay, setReplay] = useState(0);

  const formatIds = display?.formats.join(",") ?? "";
  const specs = useMemo(
    () => DISPLAY_FORMATS.filter((f) => formatIds.split(",").includes(f.id)),
    [formatIds]
  );
  const { banners: html5, building } = useHtml5Banners(display, specs, target, clickUrl, mode === "html5");

  if (!display) return null;

  const update = (next: Partial<DisplaySet>) => {
    setDisplay({ ...display, ...next });
    setRendered({}); // renderade filer gäller inte längre
  };
  const updateContent = (patch: Partial<DisplayContent>) => update({ content: { ...display.content, ...patch } });
  const updateOverride = (id: string, patch: DisplayOverride | null) => {
    const overrides = { ...display.overrides };
    if (patch === null) delete overrides[id];
    else overrides[id] = { ...overrides[id], ...patch };
    update({ overrides });
  };
  const resetFromVideo = () => {
    setDisplay(freshSet(config.title || display.name, displayContentFromVideo(config)));
    setRendered({});
  };

  const post = async (endpoint: string) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set: display }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Något gick fel");
    }
    return res;
  };

  const renderAll = async () => {
    setBusy("render");
    setError(null);
    try {
      const res = await post("/api/display/render");
      const data = (await res.json()) as { banners: Array<RenderedInfo & { formatId: string }> };
      setRendered(Object.fromEntries(data.banners.map((b) => [b.formatId, b])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renderingen misslyckades");
    } finally {
      setBusy(null);
    }
  };

  const exportZip = async () => {
    setBusy("export");
    setError(null);
    try {
      const res =
        mode === "html5"
          ? await fetch("/api/display/html5-export", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                set: display,
                target,
                clickUrl,
                banners: Object.fromEntries(
                  Object.entries(html5).map(([id, b]) => [id, { html: b.pkg.html, durationSeconds: b.pkg.durationSeconds }])
                ),
              }),
            })
          : await post("/api/display/export");
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Exporten misslyckades");
      }
      const blob = await res.blob();
      const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "display.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exporten misslyckades");
    } finally {
      setBusy(null);
    }
  };

  const selectedSpec = specs.find((s) => s.id === selected) ?? null;

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-3 border-b border-nordea-border bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/create/video"
            aria-label="Tillbaka till videon"
            title="Tillbaka till videon"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-nordea-text-tertiary hover:text-nordea-text hover:bg-nordea-bg-hover"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <input
              value={display.name}
              onChange={(e) => update({ name: e.target.value })}
              aria-label="Kampanjens namn"
              className="block w-[260px] max-w-full bg-transparent text-sm font-semibold text-nordea-text rounded px-1 -mx-1 hover:bg-nordea-bg-hover focus:bg-nordea-bg focus:outline-none focus:ring-2 focus:ring-nordea-blue/15"
            />
            <p className="text-[11px] text-nordea-text-tertiary">
              Displayformat · {specs.length} format · {mode === "html5" ? "animerade HTML5-banners" : "statiska bilder"}
            </p>
          </div>
          <div className="ml-2 flex rounded-lg bg-nordea-bg p-0.5" role="tablist" aria-label="Typ av banner">
            {(["static", "html5"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === m ? "bg-white text-nordea-blue shadow-sm" : "text-nordea-text-tertiary hover:text-nordea-text"}`}
              >
                {m === "static" ? "Statiska" : "Animerade (HTML5)"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "static" ? (
            <>
              <button type="button" onClick={() => setShowBoxes((v) => !v)} className="nordea-btn nordea-btn-ghost nordea-btn-sm" title="Visa layoutens rutor">
                <Scan className="w-4 h-4" />
                {showBoxes ? "Dölj rutor" : "Visa rutor"}
              </button>
              <button type="button" onClick={() => void renderAll()} disabled={!!busy} className="nordea-btn nordea-btn-secondary nordea-btn-sm disabled:opacity-50">
                {busy === "render" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Rendera och kontrollera vikt
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setReplay((r) => r + 1)} className="nordea-btn nordea-btn-ghost nordea-btn-sm">
                <RotateCcw className="w-4 h-4" />
                Spela igen
              </button>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as Html5Target)}
                aria-label="Annonsserver"
                title={HTML5_TARGETS[target].note}
                className="h-8 rounded-md border border-nordea-border bg-white px-2 text-xs text-nordea-text"
              >
                {(Object.keys(HTML5_TARGETS) as Html5Target[]).map((t) => (
                  <option key={t} value={t}>
                    {HTML5_TARGETS[t].label}
                  </option>
                ))}
              </select>
              <input
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                aria-label="Klickadress"
                placeholder="https://www.nordea.se/…"
                className="h-8 w-[220px] rounded-md border border-nordea-border bg-white px-2 text-xs text-nordea-text focus:outline-none focus:border-nordea-blue/40"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => void exportZip()}
            disabled={!!busy || (mode === "html5" && (building || Object.keys(html5).length === 0))}
            className="nordea-btn nordea-btn-primary nordea-btn-sm disabled:opacity-50"
          >
            {busy === "export" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {mode === "html5" ? "Ladda ner HTML5-paket" : "Ladda ner paket"}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside className="w-[320px] flex-shrink-0 border-r border-nordea-border bg-white overflow-y-auto p-4 space-y-5">
          <ContentEditor content={display.content} onChange={updateContent} onReset={resetFromVideo} />
          {selectedSpec && (
            <OverrideEditor
              spec={selectedSpec}
              content={display.content}
              override={display.overrides[selectedSpec.id]}
              onChange={(patch) => updateOverride(selectedSpec.id, patch)}
              onClear={() => updateOverride(selectedSpec.id, null)}
            />
          )}
        </aside>

        <main className="flex-1 min-w-0 overflow-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-nordea-rose/20 bg-nordea-rose-soft px-3 py-2 text-sm text-nordea-rose">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-6 items-start">
            {specs.map((spec) => (
              <BannerCard
                key={spec.id}
                spec={spec}
                content={resolveContent(display.content, display.overrides[spec.id])}
                adjusted={!!display.overrides[spec.id]}
                selected={selected === spec.id}
                onSelect={() => setSelected(selected === spec.id ? null : spec.id)}
                rendered={mode === "static" ? rendered[spec.id] : undefined}
                showBoxes={showBoxes && mode === "static"}
                html5={mode === "html5" ? html5[spec.id] ?? null : undefined}
                replay={replay}
              />
            ))}
          </div>
          <p className="mt-8 text-[11px] text-nordea-text-faint max-w-2xl leading-relaxed">
            Displayramarna bygger på Nordeas display-spec (MREC, Billboard, Half page) och videogrammatiken — de är ett
            utkast tills Nordeas egna displaybanners analyserats. Maxvikterna är standardvärden; kontrollera mot
            publicisternas spec och mediaplanen före trafikering.
          </p>
        </main>
      </div>
    </div>
  );
}

function BannerCard({
  spec,
  content,
  adjusted,
  selected,
  onSelect,
  rendered,
  showBoxes,
  html5,
  replay,
}: {
  spec: DisplayFormatSpec;
  content: DisplayContent;
  adjusted: boolean;
  selected: boolean;
  onSelect: () => void;
  rendered?: RenderedInfo;
  showBoxes: boolean;
  /** undefined = statiskt läge; null = HTML5 byggs. */
  html5?: Html5Pair | null;
  replay: number;
}) {
  const issues = useMemo(() => {
    if (rendered) return rendered.issues;
    const base = lintDisplay(spec, content, layoutDisplay(spec.width, spec.height, content, spec.family));
    return html5 ? [...base, ...html5.pkg.issues] : base;
  }, [rendered, spec, content, html5]);
  const frame = Math.round((content.illustration?.atSeconds ?? 0) * FPS);
  const props: DisplayBannerProps = { content, width: spec.width, height: spec.height, family: spec.family, showBoxes };
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="flex flex-col gap-2" style={{ width: Math.max(spec.width, 240) }}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-semibold text-nordea-text">
          {spec.label} <span className="font-normal text-nordea-text-tertiary tabular-nums">{spec.width}×{spec.height}</span>
          {adjusted && <span className="ml-1.5 text-[10px] text-nordea-blue">justerad</span>}
        </div>
        <span className={`text-[10px] font-medium ${errors ? "text-nordea-rose" : warnings ? "text-nordea-amber" : "text-nordea-green"}`}>
          {errors ? `${errors} fel` : warnings ? `${warnings} varning` : "OK"}
        </span>
      </div>
      <button
        type="button"
        onClick={onSelect}
        title="Justera texten för det här formatet"
        className={`block rounded-sm ring-offset-2 transition-shadow ${selected ? "ring-2 ring-nordea-blue" : "ring-1 ring-nordea-border hover:ring-nordea-blue/40"}`}
        style={{ width: spec.width, height: spec.height }}
      >
        {html5 !== undefined ? (
          html5 ? (
            <iframe
              key={replay}
              title={`${spec.label} ${spec.width}×${spec.height} (HTML5)`}
              srcDoc={html5.preview.html}
              width={spec.width}
              height={spec.height}
              sandbox="allow-scripts allow-popups"
              className="block border-0 pointer-events-none"
            />
          ) : (
            <div className="flex items-center justify-center bg-nordea-bg" style={{ width: spec.width, height: spec.height }}>
              <Loader2 className="w-4 h-4 animate-spin text-nordea-text-tertiary" />
            </div>
          )
        ) : rendered && !showBoxes ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rendered.src} alt={`${spec.label} ${spec.width}×${spec.height}`} width={spec.width} height={spec.height} className="block" />
        ) : (
          <Thumbnail
            component={DisplayBanner}
            compositionWidth={spec.width}
            compositionHeight={spec.height}
            frameToDisplay={frame}
            durationInFrames={frame + 1}
            fps={FPS}
            inputProps={props}
            style={{ width: spec.width, height: spec.height }}
          />
        )}
      </button>
      <div className="text-[10px] text-nordea-text-tertiary tabular-nums">
        {spec.channel}
        {html5 && (
          <span>
            {" "}· ca {Math.round(html5.pkg.estimatedBytes / 1024)} kB okomprimerat · {html5.pkg.durationSeconds.toFixed(1).replace(".", ",")} s
          </span>
        )}
        {rendered && (
          <span className={rendered.withinLimit ? "" : "text-nordea-rose font-medium"}>
            {" "}· {rendered.mime === "image/png" ? "PNG" : "JPG"} {Math.round(rendered.bytes / 1024)} / {rendered.maxKb} kB
          </span>
        )}
      </div>
      {issues.length > 0 && (
        <ul className="space-y-0.5">
          {issues.map((i, n) => (
            <li key={n} className="flex items-start gap-1 text-[11px] leading-snug">
              {i.severity === "info" ? (
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-nordea-text-faint" />
              ) : (
                <AlertCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${i.severity === "error" ? "text-nordea-rose" : "text-nordea-amber"}`} />
              )}
              <span className={i.severity === "info" ? "text-nordea-text-tertiary" : "text-nordea-text"}>{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-nordea-border bg-nordea-bg px-2.5 py-1.5 text-sm text-nordea-text focus:outline-none focus:border-nordea-blue/40 focus:ring-2 focus:ring-nordea-blue/10";
const labelCls = "block text-[11px] font-medium text-nordea-text-secondary mb-1";

function ContentEditor({
  content,
  onChange,
  onReset,
}: {
  content: DisplayContent;
  onChange: (patch: Partial<DisplayContent>) => void;
  onReset: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-nordea-text">Budskap i alla format</h2>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-[11px] text-nordea-text-tertiary hover:text-nordea-blue" title="Hämta rubrik, knapp och illustration från videon igen">
          <RefreshCw className="w-3 h-3" />
          Från videon
        </button>
      </div>
      <div>
        <label className={labelCls} htmlFor="d-headline">Rubrik <span className="font-normal text-nordea-text-faint">(**fet** för nyckelord)</span></label>
        <textarea id="d-headline" rows={2} value={content.headline} onChange={(e) => onChange({ headline: e.target.value })} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls} htmlFor="d-subline">Underrubrik</label>
        <textarea id="d-subline" rows={2} value={content.subline ?? ""} onChange={(e) => onChange({ subline: e.target.value || undefined })} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls} htmlFor="d-cta">Knapp</label>
        <input id="d-cta" value={content.cta ?? ""} onChange={(e) => onChange({ cta: e.target.value || undefined })} className={inputCls} />
      </div>
      <div>
        <span className={labelCls}>Bakgrund</span>
        <div className="flex gap-1.5">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.hex}
              type="button"
              title={b.label}
              aria-label={b.label}
              onClick={() => onChange({ background: b.hex })}
              className={`w-7 h-7 rounded-md border ${content.background.toLowerCase() === b.hex.toLowerCase() ? "ring-2 ring-nordea-blue ring-offset-1 border-transparent" : "border-nordea-border"}`}
              style={{ backgroundColor: b.hex }}
            />
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-nordea-bg px-3 py-2 text-[11px] leading-relaxed text-nordea-text-secondary space-y-1">
        <div className="flex items-center gap-1.5">
          {content.illustration ? <Check className="w-3 h-3 text-nordea-green" /> : <ImageOff className="w-3 h-3 text-nordea-text-faint" />}
          {content.illustration ? "Illustrationen från videon används" : "Ingen illustration — videon saknar en illustrationsscen med rubrik"}
        </div>
        {content.legal?.creditWarning && <div>Konsumentverkets varning läggs i alla format (kreditprodukt).</div>}
        {content.legal?.riskNote && <div>Riskrad: {content.legal.riskNote}</div>}
      </div>
      <p className="text-[11px] text-nordea-text-faint">Klicka på ett format för att justera texten bara där.</p>
    </section>
  );
}

function OverrideEditor({
  spec,
  content,
  override,
  onChange,
  onClear,
}: {
  spec: DisplayFormatSpec;
  content: DisplayContent;
  override?: DisplayOverride;
  onChange: (patch: DisplayOverride) => void;
  onClear: () => void;
}) {
  return (
    <section className="space-y-3 border-t border-nordea-hairline pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-nordea-text">
          {spec.label} <span className="font-normal text-nordea-text-tertiary">{spec.width}×{spec.height}</span>
        </h2>
        {override && (
          <button type="button" onClick={onClear} className="text-[11px] text-nordea-text-tertiary hover:text-nordea-text">
            Återställ
          </button>
        )}
      </div>
      <div>
        <label className={labelCls} htmlFor="o-headline">Rubrik i det här formatet</label>
        <textarea
          id="o-headline"
          rows={2}
          value={override?.headline ?? ""}
          placeholder={content.headline}
          onChange={(e) => onChange({ headline: e.target.value || undefined })}
          className={`${inputCls} resize-none`}
        />
      </div>
      <label className="flex items-center gap-2 text-[12px] text-nordea-text">
        <input type="checkbox" checked={override?.subline === null} onChange={(e) => onChange({ subline: e.target.checked ? null : undefined })} />
        Dölj underrubriken
      </label>
      <label className="flex items-center gap-2 text-[12px] text-nordea-text">
        <input type="checkbox" checked={!!override?.hideIllustration} onChange={(e) => onChange({ hideIllustration: e.target.checked || undefined })} />
        Dölj illustrationen
      </label>
    </section>
  );
}
