// ── Regelkontroll per displayformat (deterministisk) ──

import { stripRichText } from "@/lib/remotion/rich-text";
import { contrastRatio } from "@/lib/remotion/color";
import type { DisplayFormatSpec } from "@/lib/formats/registry";
import { MIN_LEGAL_SIZE, type Box, type DisplayLayout } from "./layout";
import type { DisplayContent } from "./types";

export interface DisplayIssue {
  severity: "error" | "warning" | "info";
  message: string;
}

// Nordeas CTA-regler (lib/nordea-brand-guidelines.ts): mjuka uppmaningar.
const FORBIDDEN_CTA = [/ansök nu/i];

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
}

function inside(a: Box, w: number, h: number): boolean {
  return a.x >= -0.5 && a.y >= -0.5 && a.x + a.w <= w + 0.5 && a.y + a.h <= h + 0.5;
}

/** Ungefär hur många tecken rubriken får ha för att rymmas. */
function suggestedLength(content: DisplayContent, layout: DisplayLayout): number {
  const chars = stripRichText(content.headline).length;
  const need = layout.headline.lines / layout.headline.maxLines;
  return Math.max(8, Math.floor(chars / Math.max(1, need) * 0.9));
}

export function lintDisplay(spec: DisplayFormatSpec, content: DisplayContent, layout: DisplayLayout): DisplayIssue[] {
  const issues: DisplayIssue[] = [];

  if (!stripRichText(content.headline).trim()) {
    issues.push({ severity: "error", message: "Rubrik saknas" });
  } else if (!layout.headline.fits) {
    issues.push({
      severity: "error",
      message: `Rubriken ryms inte i ${spec.width}×${spec.height} ens i ${layout.headline.minSize} px — korta till ungefär ${suggestedLength(content, layout)} tecken`,
    });
  }

  if (content.subline?.trim() && !layout.subline) {
    issues.push({ severity: "info", message: "Underrubriken får inte plats och visas inte i det här formatet" });
  }
  if (content.illustration && !layout.illustration) {
    issues.push({ severity: "info", message: "Illustrationen får inte plats och visas inte i det här formatet" });
  }

  if (!content.cta?.trim()) {
    issues.push({ severity: "warning", message: "Ingen knapp — displaybanners behöver en tydlig uppmaning" });
  } else if (FORBIDDEN_CTA.some((re) => re.test(content.cta ?? ""))) {
    issues.push({ severity: "warning", message: `"${content.cta}" är för pushigt för Nordea — använd t.ex. "Läs mer" eller "Se dina förmåner"` });
  }

  if (layout.creditBand && layout.creditBand.bodySize < MIN_LEGAL_SIZE) {
    issues.push({
      severity: "warning",
      message: `Konsumentverkets varning blir ${layout.creditBand.bodySize} px — stäm av läsbarheten med juridik eller välj ett större format`,
    });
  }

  const headlineColor = content.headlineColor ?? null;
  if (headlineColor) {
    const ratio = contrastRatio(headlineColor, content.background);
    if (ratio !== null && ratio < 3) {
      issues.push({ severity: "warning", message: `Rubrikfärgen har för låg kontrast mot bakgrunden (${ratio.toFixed(1)}:1) och ersätts av textfärgen` });
    }
  }

  // Sanity: rutorna ska ligga inom ytan och inte krocka.
  const boxes: Array<[string, Box | null | undefined]> = [
    ["loggan", layout.logo],
    ["illustrationen", layout.illustration],
    ["texten", layout.text],
    ["knappen", layout.cta?.box],
    ["varningsbandet", layout.creditBand?.box],
    ["riskraden", layout.riskNote?.box],
  ];
  const present = boxes.filter((b): b is [string, Box] => !!b[1] && b[1].w > 0 && b[1].h > 0);
  for (const [name, box] of present) {
    if (!inside(box, spec.width, spec.height)) issues.push({ severity: "error", message: `${name} hamnar utanför formatet` });
  }
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      if (overlaps(present[i][1], present[j][1])) {
        issues.push({ severity: "error", message: `${present[i][0]} och ${present[j][0]} överlappar` });
      }
    }
  }

  return issues;
}
