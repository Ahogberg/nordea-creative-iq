// ── Animerade HTML5-banners ──
//
// Ren funktion: displayinnehåll + format → en fristående index.html med
// inline CSS-animationer. Ingen React, ingen Remotion, inga externa anrop
// (utom Adforms eget skript i Adform-versionen). Layouten är densamma som i
// de statiska bilderna (layout.ts), så animationens slutbild är identisk med
// reservbilden.
//
// Rörelse:
//  - loggan tonar in, rubriken kommer ord för ord, underrubriken och knappen efter
//  - illustrationen: lagrens keyframes (MotionLayer) blir CSS-keyframes — det
//    som i videon är "rörelse som data" följer med; annan rörelse i koden
//    visas i sitt slutläge
//  - juridiken (varningsband, riskrad) syns hela tiden, utan animation
//  - spelas en gång och stannar på slutbilden; prefers-reduced-motion respekteras

import { stripRichText, hasRichMarkup, tokenizeRichText } from "@/lib/remotion/rich-text";
import { CREDIT_WARNING_BODY, CREDIT_WARNING_TITLE } from "@/lib/remotion/legal-text";
import { sampleLayer, keyframeTimes } from "@/lib/remotion/layers-math";
import { themeColors } from "@/lib/remotion/theme-colors";
import { colors } from "@/lib/remotion/styles";
import type { DisplayFormatSpec } from "@/lib/formats/registry";
import { layoutDisplay, HEADLINE_LINE, SUBLINE_LINE, type Box } from "../layout";
import type { DisplayIssue } from "../lint";
import type { DisplayContent } from "../types";
import type { MotionLayer } from "@/lib/remotion/types";

export type Html5Target = "iab" | "adform";

export const HTML5_TARGETS: Record<Html5Target, { label: string; note: string }> = {
  iab: {
    label: "Standard (clickTag)",
    note: "Google CM360/DV360, Xandr, The Trade Desk, Readpeak och de flesta svenska publicister",
  },
  adform: { label: "Adform", note: "Adform DHTML-skript och manifest.json" },
};

/** IAB:s riktvärde för första laddningen. Publicisterna kan ha egna gränser. */
export const HTML5_MAX_KB = 150;
/** IAB: animationen ska vara klar inom 15 sekunder. */
export const HTML5_MAX_SECONDS = 15;

export interface AssetFile {
  /** Sökväg under public/ (för förhandsvisning och för servern som packar). */
  publicPath: string;
  /** Sökväg i paketet. */
  zipPath: string;
  bytes: number;
}

interface FontFile {
  family: "NSL" | "NSS";
  weight: number;
  publicPath: string;
  zipPath: string;
  bytes: number;
}

// Typsnitten som bannern kan behöva (woff2-storlek i byte, för viktkontrollen).
const FONTS: Record<"headlineBold" | "headlineRegular" | "body" | "cta", FontFile> = {
  headlineBold: { family: "NSL", weight: 700, publicPath: "/fonts/nordea-sans-large/NordeaSansLarge-Bold.woff2", zipPath: "fonts/NordeaSansLarge-Bold.woff2", bytes: 27584 },
  headlineRegular: { family: "NSL", weight: 400, publicPath: "/fonts/nordea-sans-large/NordeaSansLarge-Regular.woff2", zipPath: "fonts/NordeaSansLarge-Regular.woff2", bytes: 27028 },
  body: { family: "NSS", weight: 400, publicPath: "/fonts/nordea-sans-small/NordeaSansSmall-Regular.woff2", zipPath: "fonts/NordeaSansSmall-Regular.woff2", bytes: 26420 },
  cta: { family: "NSS", weight: 500, publicPath: "/fonts/nordea-sans-small/NordeaSansSmall-Medium.woff2", zipPath: "fonts/NordeaSansSmall-Medium.woff2", bytes: 26880 },
};

export const LOGO: AssetFile = { publicPath: "/images/nordea-logo-neg.png", zipPath: "logo.png", bytes: 6616 };

/** Alla filer en banner kan referera — servern packar bara dessa. */
export const HTML5_ASSET_ALLOWLIST: AssetFile[] = [...Object.values(FONTS).map((f) => ({ publicPath: f.publicPath, zipPath: f.zipPath, bytes: f.bytes })), LOGO];

/** Lager i illustrationen, som den statiska renderingen hittade dem. */
export interface LayerInstance {
  /** CSS-klass på <g> i illustrationens markup. */
  cls: string;
  id: string;
  origin: [number, number];
}

/** Illustrationen som färdig markup (se illustration.tsx). */
export interface StaticIllustration {
  html: string;
  layers: LayerInstance[];
  /** Ritytans storlek och läge i illustrationsrutan (px). */
  width: number;
  height: number;
  /** Designskala → px (samma som lagrens `scale`). */
  scale: number;
}

export interface Html5Options {
  target: Html5Target;
  clickUrl: string;
  /** "preview" = filer från webbplatsen, "package" = relativa sökvägar i zip. */
  assets: "preview" | "package";
  illustration?: StaticIllustration | null;
  motionLayers?: MotionLayer[];
  title?: string;
  /**
   * Filer inbäddade som data-URL (publicPath → data-URL). Loggan bäddas alltid
   * in (liten, och CSS-masker kräver samma ursprung); i förhandsvisningen även
   * typsnitten, eftersom den sandlådade iframen inte får hämta dem.
   */
  embedded?: Record<string, string>;
}

export interface Html5Banner {
  html: string;
  files: AssetFile[];
  /** Uppskattad vikt (okomprimerad) i byte — servern mäter den riktiga. */
  estimatedBytes: number;
  durationSeconds: number;
  issues: DisplayIssue[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const px = (n: number) => `${Math.round(n * 100) / 100}px`;
const sec = (n: number) => `${Math.round(n * 100) / 100}s`;
const pos = (b: Box) => `left:${px(b.x)};top:${px(b.y)};width:${px(b.w)};height:${px(b.h)}`;

const WARNING_RED = "#911D26";
const TRIANGLE_SVG = (size: number) =>
  `<svg width="${size}" height="${Math.round(size * 0.88)}" viewBox="0 0 100 88" style="flex-shrink:0;display:block"><path d="M50 6 L95 82 L5 82 Z" fill="none" stroke="${WARNING_RED}" stroke-width="9" stroke-linejoin="round"/><rect x="45" y="30" width="10" height="30" rx="4" fill="${WARNING_RED}"/><circle cx="50" cy="70" r="6" fill="${WARNING_RED}"/></svg>`;

// Tidslinjen (sekunder).
const LOGO_IN = 0;
const WORDS_START = 0.35;
const WORD_STEP = 0.07;
const WORD_DUR = 0.5;
const MAX_STAGGER = 1.2;
const LAYER_SAMPLE = 1 / 12;

function layerTransform(x: number, y: number, rotation: number, scale: number, [ox, oy]: [number, number]): string {
  return `translate(${px(x)},${px(y)}) translate(${px(ox)},${px(oy)}) rotate(${Math.round(rotation * 100) / 100}deg) scale(${Math.round(scale * 1000) / 1000}) translate(${px(-ox)},${px(-oy)})`;
}

/** CSS-keyframes för ett lager — samplat så att lagrets egna kurvor följer med. */
function layerCss(inst: LayerInstance, layer: MotionLayer, scale: number): { css: string; end: number } | null {
  const times = keyframeTimes(layer);
  if (times.length === 0) return null;
  const end = Math.max(...times);
  if (end <= 0) return null;
  const steps: string[] = [];
  const n = Math.max(1, Math.ceil(end / LAYER_SAMPLE));
  for (let i = 0; i <= n; i++) {
    const t = (end * i) / n;
    const s = sampleLayer(layer, t);
    const pct = Math.round((t / end) * 10000) / 100;
    steps.push(`${pct}%{transform:${layerTransform(s.x * scale, s.y * scale, s.rotation, s.scale, inst.origin)};opacity:${Math.round(s.opacity * 1000) / 1000}}`);
  }
  return {
    css: `@keyframes k-${inst.cls}{${steps.join("")}}.${inst.cls}{transform-box:view-box;transform-origin:0 0;animation:k-${inst.cls} ${sec(end)} linear both}`,
    end,
  };
}

function clickScript(target: Html5Target, clickUrl: string): { head: string; open: string } {
  const url = JSON.stringify(clickUrl);
  if (target === "adform") {
    return {
      head:
        `<script src="https://s1.adform.net/banners/scripts/rmb/Adform.DHTML.js?bv=2"></script>` +
        `<script>var clickTAGvalue=dhtml.getVar("clickTAG",${url});var landingpagetarget=dhtml.getVar("landingPageTarget","_blank");</script>`,
      open: "window.open(clickTAGvalue,landingpagetarget)",
    };
  }
  return { head: `<script>var clickTag=${url};</script>`, open: `window.open(window.clickTag,"_blank")` };
}

export function buildHtml5Banner(content: DisplayContent, spec: DisplayFormatSpec, opts: Html5Options): Html5Banner {
  const layout = layoutDisplay(spec.width, spec.height, content, spec.family);
  const theme = themeColors(content.background, content.headlineColor);
  const embedded = opts.embedded ?? {};
  const asset = (f: { publicPath: string; zipPath: string }) =>
    embedded[f.publicPath] ?? (opts.assets === "preview" ? f.publicPath : f.zipPath);
  const issues: DisplayIssue[] = [];

  // ── Typsnitt: bara de vikter som används ──
  const rich = hasRichMarkup(content.headline);
  const fonts = [FONTS.headlineBold];
  if (rich) fonts.push(FONTS.headlineRegular);
  if ((layout.subline && content.subline) || layout.riskNote || layout.creditBand) fonts.push(FONTS.body);
  if (layout.cta && content.cta) fonts.push(FONTS.cta);
  const fontCss = fonts
    .map((f) => `@font-face{font-family:"${f.family}";src:url("${asset(f)}") format("woff2");font-weight:${f.weight};font-display:block}`)
    .join("");

  // ── Rubriken ord för ord ──
  const words = tokenizeRichText(content.headline, "word");
  const step = words.length > 1 ? Math.min(WORD_STEP, MAX_STAGGER / (words.length - 1)) : 0;
  const headlineHtml = words
    .map((tokens, i) => {
      const inner = tokens
        .map((t) => {
          const weight = rich ? (t.bold ? 700 : 400) : 700;
          return `<span style="font-weight:${weight}">${esc(t.text.trimEnd())}</span>`;
        })
        .join("");
      return `<span class="w" style="animation-delay:${sec(WORDS_START + i * step)}">${inner}</span>`;
    })
    .join(" ");
  const wordsEnd = WORDS_START + Math.max(0, words.length - 1) * step + WORD_DUR;
  const sublineAt = wordsEnd - 0.2;
  const ctaAt = (layout.subline && content.subline ? sublineAt + 0.35 : wordsEnd - 0.1);

  // ── Illustration + lager ──
  let layerStyles = "";
  let layersEnd = 0;
  let illustrationHtml = "";
  if (layout.illustration && opts.illustration) {
    const ill = opts.illustration;
    for (const inst of ill.layers) {
      const layer = opts.motionLayers?.find((l) => l.id === inst.id);
      if (!layer) continue;
      const r = layerCss(inst, layer, ill.scale);
      if (r) {
        layerStyles += r.css;
        layersEnd = Math.max(layersEnd, r.end);
      }
    }
    const box = layout.illustration;
    illustrationHtml =
      `<div class="a" style="${pos(box)};overflow:hidden;animation:fade .4s both">` +
      `<div style="position:absolute;left:${px((box.w - ill.width) / 2)};top:${px((box.h - ill.height) / 2)};width:${px(ill.width)};height:${px(ill.height)}">${ill.html}</div>` +
      `</div>`;
  }

  const durationSeconds = Math.max(ctaAt + 0.45, layersEnd);
  if (durationSeconds > HTML5_MAX_SECONDS) {
    issues.push({ severity: "warning", message: `Animationen är ${durationSeconds.toFixed(1)} s — IAB:s riktlinje är högst ${HTML5_MAX_SECONDS} s` });
  }

  // ── Delarna ──
  // Enkla citattecken: masken står i ett style-attribut med dubbla.
  const logoMask = `url('${asset(LOGO)}') center/contain no-repeat`;
  const logoHtml = `<div class="a" style="${pos(layout.logo)};background-color:${theme.text};-webkit-mask:${logoMask};mask:${logoMask};animation:fade .5s ${sec(LOGO_IN)} both"></div>`;

  const sublineHtml =
    layout.subline && content.subline
      ? `<div class="u" style="font:400 ${px(layout.subline.size)}/${SUBLINE_LINE} NSS,Arial,sans-serif;color:${theme.textSecondary};margin-top:${px(layout.sublineGap)};animation-delay:${sec(sublineAt)}">${esc(stripRichText(content.subline))}</div>`
      : "";
  const textHtml =
    `<div class="a" style="${pos(layout.text)};text-align:${layout.align}">` +
    `<div style="font:700 ${px(layout.headline.size)}/${HEADLINE_LINE} NSL,Arial,sans-serif;color:${theme.headline};letter-spacing:-0.01em">${headlineHtml}</div>` +
    sublineHtml +
    `</div>`;

  const ctaHtml =
    layout.cta && content.cta
      ? `<div class="a cta" style="${pos(layout.cta.box)};font:500 ${px(layout.cta.fontSize)}/1 NSS,Arial,sans-serif;animation-delay:${sec(ctaAt)}">${esc(content.cta)}</div>`
      : "";

  const riskHtml =
    layout.riskNote && content.legal?.riskNote
      ? `<div class="a" style="${pos(layout.riskNote.box)};display:flex;align-items:center;justify-content:${layout.align === "center" ? "center" : "flex-start"};padding-left:${layout.align === "center" ? 0 : px(layout.text.x)};box-sizing:border-box;font:400 ${px(layout.riskNote.size)}/1.2 NSS,Arial,sans-serif;color:${theme.textSecondary}">${esc(content.legal.riskNote)}</div>`
      : "";

  const cb = layout.creditBand;
  const creditHtml = cb
    ? `<div class="a" style="${pos(cb.box)};background:#fff;padding:${px(cb.padding)};box-sizing:border-box;display:flex;gap:6px;align-items:flex-start;color:#000;overflow:hidden">${TRIANGLE_SVG(cb.triangle)}<div style="min-width:0"><div style="font:700 ${px(cb.titleSize)}/1.2 NSS,Arial,sans-serif">${esc(CREDIT_WARNING_TITLE)}</div><div style="font:400 ${px(cb.bodySize)}/1.25 NSS,Arial,sans-serif">${esc(CREDIT_WARNING_BODY)}</div></div></div>`
    : "";

  const click = clickScript(opts.target, opts.clickUrl);
  const label = esc(stripRichText(content.headline));
  const css =
    fontCss +
    `html,body{margin:0;padding:0;background:transparent}` +
    `#ad{position:relative;width:${spec.width}px;height:${spec.height}px;overflow:hidden;background:${content.background};cursor:pointer;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-synthesis:none}` +
    `.a{position:absolute}` +
    `.w{display:inline-block;animation:up ${sec(WORD_DUR)} cubic-bezier(.2,.7,.2,1) both}` +
    `.u{animation:up .5s cubic-bezier(.2,.7,.2,1) both}` +
    `.cta{display:flex;align-items:center;justify-content:center;border-radius:999px;background:${colors.teal};color:#fff;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;animation:pop .45s cubic-bezier(.2,.7,.2,1) both}` +
    `@keyframes fade{from{opacity:0}to{opacity:1}}` +
    `@keyframes up{from{opacity:0;transform:translateY(.35em)}to{opacity:1;transform:none}}` +
    `@keyframes pop{0%{opacity:0;transform:scale(.85)}60%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}` +
    layerStyles +
    `@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}`;

  const html =
    `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8">` +
    `<meta name="ad.size" content="width=${spec.width},height=${spec.height}">` +
    `<meta name="viewport" content="width=${spec.width},initial-scale=1">` +
    `<title>${esc(opts.title ?? "Nordea")}</title>` +
    click.head +
    `<style>${css}</style></head><body>` +
    `<div id="ad" role="link" tabindex="0" aria-label="${label}">` +
    illustrationHtml +
    logoHtml +
    textHtml +
    ctaHtml +
    riskHtml +
    creditHtml +
    `</div>` +
    `<script>(function(){var ad=document.getElementById("ad");function go(){${click.open}}ad.addEventListener("click",go);ad.addEventListener("keydown",function(e){if(e.key==="Enter")go()})})();</script>` +
    `</body></html>`;

  const files: AssetFile[] = [...fonts.map((f) => ({ publicPath: f.publicPath, zipPath: f.zipPath, bytes: f.bytes })), LOGO].filter(
    (f) => !embedded[f.publicPath]
  );
  const estimatedBytes = new TextEncoder().encode(html).length + files.reduce((s, f) => s + f.bytes, 0);
  if (estimatedBytes > HTML5_MAX_KB * 1024) {
    issues.push({ severity: "warning", message: `Cirka ${Math.round(estimatedBytes / 1024)} kB — över IAB:s riktvärde ${HTML5_MAX_KB} kB för första laddningen` });
  }
  if (!/^https:\/\//.test(opts.clickUrl)) {
    issues.push({ severity: "error", message: "Klickadressen ska börja med https://" });
  }

  return { html, files, estimatedBytes, durationSeconds, issues };
}
