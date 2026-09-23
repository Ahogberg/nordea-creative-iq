// ── Rich text: `**fet**` i rubriker ──
//
// Nordeas annonser blandar vikter i samma rubrik: löptext i regular och
// nyckelordet i bold ("Spara **tid** eller spara **pengar?**"). Texten lagras
// som vanlig sträng med `**…**` runt det som ska vara fett.
//
// Utan markup renderas texten som förut (en vikt, oftast 900), så gamla
// mallar ser likadana ut.

import React from "react";

export interface RichSegment {
  text: string;
  bold: boolean;
}

/** Vikter när texten innehåller markup: löptext regular, nyckelord bold. */
export const RICH_REGULAR_WEIGHT = 400;
export const RICH_BOLD_WEIGHT = 700;

const MARKUP = /\*\*(.+?)\*\*/g;

export function hasRichMarkup(text: string | undefined): boolean {
  return !!text && /\*\*.+?\*\*/.test(text);
}

/** "Spara **tid**" → [{Spara , false}, {tid, true}] */
export function parseRichText(text: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKUP)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start), bold: false });
    segments.push({ text: m[1], bold: true });
    last = start + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false });
  return segments;
}

/** Tar bort markup — för tidslinje, bildtexter och kontroller av copy. */
export function stripRichText(text: string): string {
  return text.replace(MARKUP, "$1");
}

export interface RichToken {
  text: string;
  bold: boolean;
}

/**
 * Delar texten i animerbara bitar och behåller vikten per bit.
 *  - "word": ett ord per bit, mellanslaget ligger kvar sist i biten
 *  - "character": ett tecken per bit
 *  - "line": en rad per bit (radbrytning `\n`), segmenten behålls inom raden
 */
export function tokenizeRichText(
  text: string,
  mode: "word" | "character" | "line"
): RichToken[][] {
  const segments = parseRichText(text);
  if (mode === "line") {
    const lines: RichToken[][] = [[]];
    for (const seg of segments) {
      seg.text.split("\n").forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part) lines[lines.length - 1].push({ text: part, bold: seg.bold });
      });
    }
    return lines;
  }
  const tokens: RichToken[][] = [];
  for (const seg of segments) {
    const pieces =
      mode === "character" ? Array.from(seg.text) : seg.text.split(/(?<=\s)/);
    for (const piece of pieces) {
      if (piece) tokens.push([{ text: piece, bold: seg.bold }]);
    }
  }
  return tokens;
}

/** Renderar tokens/segment som spans med rätt vikt. */
export function renderRichTokens(
  tokens: RichToken[],
  boldWeight: number = RICH_BOLD_WEIGHT
): React.ReactNode {
  return tokens.map((t, i) =>
    t.bold ? (
      <span key={i} style={{ fontWeight: boldWeight }}>
        {t.text}
      </span>
    ) : (
      <React.Fragment key={i}>{t.text}</React.Fragment>
    )
  );
}

/**
 * Text med `**fet**`-markup. Utan markup: `text` i `fontWeight` som förut.
 * Med markup: löptext i regular och markerade ord i bold.
 */
export const RichText: React.FC<{
  text: string;
  style?: React.CSSProperties;
  as?: "span" | "p" | "div" | "h2";
}> = ({ text, style, as = "span" }) => {
  const Tag = as;
  if (!hasRichMarkup(text)) return <Tag style={style}>{text}</Tag>;
  return (
    <Tag style={{ ...style, fontWeight: RICH_REGULAR_WEIGHT }}>
      {renderRichTokens(parseRichText(text))}
    </Tag>
  );
};
