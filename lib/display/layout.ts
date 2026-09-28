// ── Layoutmotor för displaybanners ──
//
// Ren funktion: mått + innehåll → rutor i px. Styrs av formatfamiljen
// (lib/formats/registry.ts), inte av formatnamnet, så att nya storlekar
// fungerar utan specialfall. Utgångsvärdena kommer ur Nordeas display-spec
// (lib/nordea-brand-guidelines.ts: MREC 300×250, Billboard 980×240,
// Half page 300×600) och skalas med formatets bredd.
//
// Textstorlek anpassas efter längden: största storlek där texten ryms på
// högst N rader. Ryms den inte ens på minsta storlek flaggas det (fits: false)
// så att regelkontrollen kan säga till — texten krymper aldrig under minimum.

import { LOGO_ASPECT } from "@/lib/remotion/styles";
import { stripRichText } from "@/lib/remotion/rich-text";
import { CREDIT_WARNING_BODY, CREDIT_WARNING_TITLE } from "@/lib/remotion/legal-text";
import { familyFor, type DisplayFamily } from "@/lib/formats/registry";
import type { DisplayContent } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FittedText {
  size: number;
  lines: number;
  maxLines: number;
  /** false = ryms inte ens på minsta tillåtna storlek. */
  fits: boolean;
  minSize: number;
}

export interface DisplayLayout {
  width: number;
  height: number;
  family: DisplayFamily;
  align: "left" | "center";
  logo: Box;
  illustration: Box | null;
  /** Rubrik + underrubrik. */
  text: Box;
  headline: FittedText;
  subline: FittedText | null;
  /** Luft mellan rubrik och underrubrik (px). */
  sublineGap: number;
  cta: { box: Box; fontSize: number; padX: number; padY: number } | null;
  creditBand: { box: Box; padding: number; triangle: number; titleSize: number; bodySize: number } | null;
  riskNote: { box: Box; size: number } | null;
}

// Genomsnittlig teckenbredd i andel av teckenstorleken (Nordea Sans).
// Uppmätt i renderade banners: rubrik ≈0,42, brödtext ≈0,43 — med marginal
// för breda ord och fetstil.
const HEADLINE_CHAR = 0.48;
const BODY_CHAR = 0.47;
const CTA_CHAR = 0.66; // versaler + spärrning
export const HEADLINE_LINE = 1.12;
export const SUBLINE_LINE = 1.3;

const round = (n: number) => Math.round(n);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Antal rader när texten bryts på ord i bredden `width`. */
export function wrapLines(text: string, size: number, width: number, charFactor = HEADLINE_CHAR): number {
  const words = stripRichText(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const space = size * 0.28;
  let lines = 1;
  let line = 0;
  for (const word of words) {
    const w = word.length * size * charFactor;
    if (line === 0) line = w;
    else if (line + space + w <= width) line += space + w;
    else {
      lines++;
      line = w;
    }
    // Ett ord bredare än raden får en egen rad (och flaggas via fits).
    if (w > width && line === w) line = width;
  }
  return lines;
}

function longestWordFits(text: string, size: number, width: number, charFactor: number): boolean {
  const words = stripRichText(text).split(/\s+/).filter(Boolean);
  return words.every((w) => w.length * size * charFactor <= width);
}

/** Största storlek (steg 0,5 px) där texten ryms på `maxLines` rader och i höjden `maxH`. */
export function fitText(
  text: string,
  width: number,
  maxH: number,
  maxSize: number,
  minSize: number,
  maxLines: number,
  lineHeight: number,
  charFactor = HEADLINE_CHAR
): FittedText {
  for (let size = Math.floor(maxSize * 2) / 2; size >= minSize; size -= 0.5) {
    const lines = wrapLines(text, size, width, charFactor);
    if (lines <= maxLines && lines * size * lineHeight <= maxH && longestWordFits(text, size, width, charFactor)) {
      return { size, lines, maxLines, fits: true, minSize };
    }
  }
  return { size: minSize, lines: wrapLines(text, minSize, width, charFactor), maxLines, fits: false, minSize };
}

function textHeight(t: FittedText, lineHeight: number): number {
  return t.lines * t.size * lineHeight;
}

interface CtaSpec {
  fontSize: number;
  padX: number;
  padY: number;
}

function ctaBox(text: string, spec: CtaSpec): { w: number; h: number } {
  return {
    w: round(text.length * spec.fontSize * CTA_CHAR + spec.padX * 2),
    h: round(spec.fontSize * 1.2 + spec.padY * 2),
  };
}

function scaledCta(base: CtaSpec, k: number, minFont = 8): CtaSpec {
  return {
    fontSize: Math.max(minFont, Math.round(base.fontSize * k * 2) / 2),
    padX: round(base.padX * k),
    padY: round(base.padY * k),
  };
}

// Nordeas CTA-spec (NORDEA_CTA.sizes) i respektive originalformat.
const CTA_MREC: CtaSpec = { fontSize: 8, padX: 14, padY: 6 };
const CTA_HALF_PAGE: CtaSpec = { fontSize: 10, padX: 20, padY: 9 };
const CTA_BILLBOARD: CtaSpec = { fontSize: 11, padX: 26, padY: 11 };

/** Varningsbandets textstorlekar så att hela texten ryms i ytan. */
function creditFonts(inner: { w: number; h: number }, triangle: number) {
  const titleSize = clamp(Math.round(inner.h * 0.2 * 2) / 2, 7, 13);
  const availH = Math.max(1, inner.h - titleSize * 1.25);
  const availW = Math.max(1, inner.w - triangle - 6);
  const chars = CREDIT_WARNING_BODY.length;
  // Radbrytning slösar yta: räkna med bredare tecken och högre rader än i
  // renderingen (1,25) så att hela texten säkert ryms.
  const f = Math.sqrt((availH * availW) / (chars * 0.52 * 1.35));
  const bodySize = Math.floor(clamp(f, 4, titleSize * 0.85) * 2) / 2;
  return { titleSize, bodySize };
}

/**
 * Staplade format: med illustration ligger text + knapp nertill; utan
 * illustration centreras blocket i ytan under loggan.
 */
function placeStack(
  illustration: Box | null,
  top: number,
  bottom: number,
  textY: number,
  textH: number,
  ctaSize: { w: number; h: number } | null,
  gap: number
): { textY: number; ctaY: number } {
  if (illustration) return { textY, ctaY: bottom - (ctaSize?.h ?? 0) };
  const blockH = textH + (ctaSize ? gap + ctaSize.h : 0);
  const y = round(top + Math.max(0, (bottom - top - blockH) / 2));
  return { textY: y, ctaY: y + textH + gap };
}

export const MIN_LEGAL_SIZE = 7;
export { CREDIT_WARNING_TITLE };

export function layoutDisplay(width: number, height: number, content: DisplayContent, familyOverride?: DisplayFamily): DisplayLayout {
  const family = familyOverride ?? familyFor(width, height);
  const W = width;
  const H = height;
  const hasIllustration = !!content.illustration;
  const cta = content.cta?.trim() ? content.cta.trim().toUpperCase() : "";

  // ── Juridik först: den tar sin yta innan resten läggs ut ──
  let creditBand: DisplayLayout["creditBand"] = null;
  let contentW = W;
  let contentH = H;
  if (content.legal?.creditWarning) {
    const box: Box =
      family === "strip"
        ? { x: W - round(W * 0.3), y: 0, w: round(W * 0.3), h: H }
        : (() => {
            const pct = family === "box" ? 0.2 : family === "tall" ? 0.15 : H < 200 ? 0.3 : 0.26;
            const h = round(H * pct);
            return { x: 0, y: H - h, w: W, h };
          })();
    const padding = Math.max(3, round(Math.min(box.w, box.h) * 0.08));
    const triangle = round(clamp(Math.min(box.h, box.w) * 0.3, 10, 26));
    const inner = { w: box.w - padding * 2, h: box.h - padding * 2 };
    creditBand = { box, padding, triangle, ...creditFonts(inner, triangle) };
    if (family === "strip") contentW = box.x;
    else contentH = box.y;
  }

  let riskNote: DisplayLayout["riskNote"] = null;
  if (content.legal?.riskNote?.trim()) {
    const size = family === "strip" ? clamp(H * 0.08, 7, 10) : clamp(H * 0.035, 7, 11);
    const h = round(size * 1.8);
    riskNote = { box: { x: 0, y: contentH - h, w: contentW, h }, size };
    contentH -= h;
  }

  const k = W / 300;

  if (family === "box") {
    const padT = round(H * 0.072);
    const padB = round(H * 0.064);
    const padX = round(W * 0.067);
    const logoW = round(W * 0.29);
    const logoH = round(logoW / LOGO_ASPECT);
    const logo = { x: round((W - logoW) / 2), y: padT, w: logoW, h: logoH };
    const top = logo.y + logoH + round(H * 0.06);
    const bottom = contentH - padB;
    const ctaSpec = scaledCta(CTA_MREC, k);
    const ctaSize = cta ? ctaBox(cta, ctaSpec) : null;
    const ctaY = ctaSize ? bottom - ctaSize.h : bottom;
    const textW = W - padX * 2;
    const textMaxH = (ctaY - top) * (hasIllustration ? 0.55 : 1) - (ctaSize ? 8 : 0);
    // Utan bild får rubriken bära formatet och bli större.
    const headline = fitText(content.headline, textW, textMaxH, (hasIllustration ? 20 : 26) * k, 13, 3, HEADLINE_LINE);
    let subline: FittedText | null = null;
    let textH = textHeight(headline, HEADLINE_LINE);
    if (content.subline?.trim()) {
      const s = fitText(content.subline, textW, textMaxH - textH - 5, clamp(11 * k, 9, 12), 9, 2, SUBLINE_LINE, BODY_CHAR);
      if (s.fits) {
        subline = s;
        textH += 5 + textHeight(s, SUBLINE_LINE);
      }
    }
    textH = round(textH);
    const textY = round(ctaY - (ctaSize ? 8 : 0) - textH);
    const illuTop = top;
    const illuH = textY - round(H * 0.04) - illuTop;
    const illustration = hasIllustration && illuH >= H * 0.25 ? { x: padX, y: illuTop, w: textW, h: illuH } : null;
    const placed = placeStack(illustration, top, bottom, textY, textH, ctaSize, 8);
    return {
      width: W,
      height: H,
      family,
      align: "center",
      logo,
      illustration,
      text: { x: padX, y: placed.textY, w: textW, h: textH },
      headline,
      subline,
      sublineGap: 5,
      cta: ctaSize ? { box: { x: round((W - ctaSize.w) / 2), y: placed.ctaY, w: ctaSize.w, h: ctaSize.h }, ...ctaSpec } : null,
      creditBand,
      riskNote,
    };
  }

  if (family === "tall") {
    const pad = round(W * 0.08);
    const logoW = round(W * 0.42);
    const logoH = round(logoW / LOGO_ASPECT);
    const logo = { x: round((W - logoW) / 2), y: pad, w: logoW, h: logoH };
    const top = logo.y + logoH + round(H * 0.04);
    const bottom = contentH - pad;
    const ctaSpec = scaledCta(CTA_HALF_PAGE, k);
    const ctaSize = cta ? ctaBox(cta, ctaSpec) : null;
    const ctaY = ctaSize ? bottom - ctaSize.h : bottom;
    const textW = W - pad * 2;
    const textMaxH = (ctaY - top) * (hasIllustration ? 0.5 : 1) - (ctaSize ? 14 : 0);
    const headline = fitText(content.headline, textW, textMaxH, (hasIllustration ? 26 : 36) * k, 14, 5, HEADLINE_LINE);
    let subline: FittedText | null = null;
    let textH = textHeight(headline, HEADLINE_LINE);
    if (content.subline?.trim()) {
      const s = fitText(content.subline, textW, textMaxH - textH - 8, clamp(13 * k, 10, 14), 10, 4, SUBLINE_LINE, BODY_CHAR);
      if (s.fits) {
        subline = s;
        textH += 8 + textHeight(s, SUBLINE_LINE);
      }
    }
    textH = round(textH);
    const textY = round(ctaY - (ctaSize ? 14 : 0) - textH);
    const illuH = textY - round(H * 0.04) - top;
    const illustration = hasIllustration && illuH >= H * 0.15 ? { x: 0, y: top, w: W, h: illuH } : null;
    const placed = placeStack(illustration, top, bottom, textY, textH, ctaSize, 14);
    return {
      width: W,
      height: H,
      family,
      align: "center",
      logo,
      illustration,
      text: { x: pad, y: placed.textY, w: textW, h: textH },
      headline,
      subline,
      sublineGap: 8,
      cta: ctaSize ? { box: { x: round((W - ctaSize.w) / 2), y: placed.ctaY, w: ctaSize.w, h: ctaSize.h }, ...ctaSpec } : null,
      creditBand,
      riskNote,
    };
  }

  if (family === "wide") {
    const large = W >= 700;
    const kb = W / 980;
    const padX = large ? round(40 * kb) : round(W * 0.045);
    const padY = large ? round(contentH * 0.12) : round(H * 0.08);
    const ctaSpec = large ? scaledCta(CTA_BILLBOARD, kb) : scaledCta(CTA_MREC, W / 300);
    const ctaSize = cta ? ctaBox(cta, ctaSpec) : null;
    const innerH = contentH - padY * 2;

    // Loggan: egen kolumn i breda format (spec: logo | text | bild), annars överst i textkolumnen.
    const logoW = large ? round(130 * kb) : round(W * 0.26);
    const logoH = round(logoW / LOGO_ASPECT);
    const logo = large
      ? { x: padX, y: round((contentH - logoH) / 2), w: logoW, h: logoH }
      : { x: padX, y: padY, w: logoW, h: logoH };

    const illuW = hasIllustration ? round(Math.min(W * (large ? 0.3 : 0.4), innerH * (large ? 1.5 : 1.3))) : 0;
    const illustration = hasIllustration
      ? { x: W - (large ? padX : 0) - illuW, y: large ? padY : 0, w: illuW, h: large ? innerH : contentH }
      : null;

    const colX = large ? logo.x + logoW + round(48 * kb) : padX;
    const colRight = illustration ? illustration.x - round((large ? 32 : 10) * kb) : W - padX;
    const colW = colRight - colX;
    const colTop = large ? padY : logo.y + logoH + round(H * 0.06);
    const colH = contentH - padY - colTop;
    const gap = ctaSize ? (large ? 14 : 6) : 0;
    const textMaxH = colH - (ctaSize ? ctaSize.h + gap : 0);
    const headline = large
      ? fitText(content.headline, colW, textMaxH, 34 * kb, 16, 2, HEADLINE_LINE)
      : fitText(content.headline, colW, textMaxH, 17 * (W / 320), 11, 3, HEADLINE_LINE);
    let subline: FittedText | null = null;
    let textH = textHeight(headline, HEADLINE_LINE);
    if (content.subline?.trim()) {
      const subGap = large ? 8 : 4;
      const s = large
        ? fitText(content.subline, colW, textMaxH - textH - subGap, 15 * kb, 11, 2, SUBLINE_LINE, BODY_CHAR)
        : fitText(content.subline, colW, textMaxH - textH - subGap, 10, 9, 2, SUBLINE_LINE, BODY_CHAR);
      if (s.fits) {
        subline = s;
        textH += subGap + textHeight(s, SUBLINE_LINE);
      }
    }
    textH = round(textH);
    const blockH = textH + (ctaSize ? gap + ctaSize.h : 0);
    const blockY = large ? round(padY + (innerH - blockH) / 2) : colTop + Math.max(0, round((colH - blockH) / 2));
    return {
      width: W,
      height: H,
      family,
      align: "left",
      logo,
      illustration,
      text: { x: colX, y: blockY, w: colW, h: textH },
      headline,
      subline,
      sublineGap: large ? 8 : 4,
      cta: ctaSize ? { box: { x: colX, y: blockY + textH + gap, w: ctaSize.w, h: ctaSize.h }, ...ctaSpec } : null,
      creditBand,
      riskNote,
    };
  }

  // strip: allt på en rad — logga | (illustration) | text | knapp
  const kb = W / 980;
  const padX = round(24 * kb);
  const padY = round(contentH * 0.16);
  const innerH = contentH - padY * 2;
  const logoH = round(Math.min(contentH * 0.22, 26));
  const logoW = round(logoH * LOGO_ASPECT);
  const logo = { x: padX, y: round((contentH - logoH) / 2), w: logoW, h: logoH };
  const ctaSpec = scaledCta({ fontSize: 10, padX: 18, padY: 8 }, 1);
  const ctaSize = cta ? ctaBox(cta, ctaSpec) : null;
  const ctaX = ctaSize ? contentW - padX - ctaSize.w : contentW - padX;
  const illuW = hasIllustration && !creditBand ? round(innerH * 1.4 + padY) : 0;
  const illustration = illuW > 0 ? { x: logo.x + logoW + round(28 * kb), y: 0, w: illuW, h: contentH } : null;
  const colX = (illustration ? illustration.x + illuW : logo.x + logoW) + round(28 * kb);
  const colW = ctaX - round(24 * kb) - colX;
  const headline = fitText(content.headline, colW, innerH, 26, 13, 2, HEADLINE_LINE);
  let subline: FittedText | null = null;
  let textH = textHeight(headline, HEADLINE_LINE);
  if (content.subline?.trim() && headline.lines === 1) {
    const s = fitText(content.subline, colW, innerH - textH - 3, 12, 10, 1, SUBLINE_LINE, BODY_CHAR);
    if (s.fits) {
      subline = s;
      textH += 3 + textHeight(s, SUBLINE_LINE);
    }
  }
  textH = round(textH);
  return {
    width: W,
    height: H,
    family,
    align: "left",
    logo,
    illustration,
    text: { x: colX, y: round((contentH - textH) / 2), w: colW, h: textH },
    headline,
    subline,
    sublineGap: 3,
    cta: ctaSize ? { box: { x: ctaX, y: round((contentH - ctaSize.h) / 2), w: ctaSize.w, h: ctaSize.h }, ...ctaSpec } : null,
    creditBand,
    riskNote,
  };
}
