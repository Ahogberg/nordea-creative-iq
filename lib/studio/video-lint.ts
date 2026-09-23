// ── Regelkontroll av en VideoConfig ──
//
// Snabba, deterministiska kontroller mot Nordeas ramar — utan AI och utan
// rendering. Körs först i självgranskningen; fynden skickas med till den
// visuella granskningen. Där rättningen är entydig (t.ex. varningsband för
// konsumentkrediter) följer en patch med.

import type { Scene, VideoConfig } from "@/lib/remotion/types";
import type { PatchOp } from "@/lib/remotion/json-patch";
import { stripRichText } from "@/lib/remotion/rich-text";

export interface LintIssue {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  /** Entydig rättning som kan tillämpas direkt. */
  fix?: PatchOp[];
}

const PALETTE = ["#0000A0", "#00005E", "#E5EFFB", "#FBD9CA", "#FFFFFF", "#FDEEEC"];
const CREDIT_WORDS = ["kreditkort", "privatlån", "samla lån", "samlingslån", "krediter", "billån", "kontokredit", "låna pengar"];
const INVEST_WORDS = ["fond", "investera", "investering", "aktie", "sparasmart"];

function sceneTexts(scene: Scene): string[] {
  switch (scene.type) {
    case "title":
    case "cta":
      return [scene.headline, scene.subtitle ?? ""];
    case "canvas":
      return [scene.headline ?? "", scene.subtitle ?? "", scene.description ?? ""];
    case "lottie":
      return [scene.headline ?? "", scene.caption ?? ""];
    case "text-reveal":
      return scene.lines;
    case "terms":
      return [scene.heading ?? "", scene.body];
    case "counter":
      return [scene.label, scene.description ?? ""];
    case "highlight-number":
      return [scene.label, scene.description ?? ""];
    default:
      return [];
  }
}

function headlineOf(scene: Scene): string | undefined {
  if (scene.type === "title" || scene.type === "cta") return scene.headline;
  if (scene.type === "canvas" || scene.type === "lottie") return scene.headline;
  return undefined;
}

export function lintVideoConfig(config: VideoConfig): LintIssue[] {
  const issues: LintIssue[] = [];
  const text = config.scenes.flatMap(sceneTexts).join(" ").toLowerCase();
  const onlyMortgage = !CREDIT_WORDS.some((w) => text.includes(w));

  config.scenes.forEach((scene, i) => {
    const n = i + 1;
    if (scene.type === "canvas" && scene.compileError) {
      issues.push({ id: `compile-${i}`, severity: "error", message: `Scen ${n}: animationen går inte att köra (${scene.compileError})` });
    }
    const headline = headlineOf(scene);
    if (headline && stripRichText(headline).length > 70) {
      issues.push({ id: `long-${i}`, severity: "warning", message: `Scen ${n}: rubriken är lång (${stripRichText(headline).length} tecken)` });
    }
    if (scene.durationSeconds < 1.5 || scene.durationSeconds > 6) {
      issues.push({ id: `dur-${i}`, severity: "warning", message: `Scen ${n}: ${scene.durationSeconds} s är ${scene.durationSeconds < 1.5 ? "kort" : "lång"} för att läsas lugnt` });
    }
    if (scene.type === "cta") {
      issues.push({ id: `cta-${i}`, severity: "info", message: `Scen ${n}: CTA-knapp — Nordeas annonser avslutar med URL eller mjuk uppmaning` });
    }
    if (scene.type === "title" && scene.accentLine) {
      issues.push({ id: `line-${i}`, severity: "info", message: `Scen ${n}: turkos linje förekommer inte i Nordeas annonser` });
    }
    if (scene.background && !scene.background.startsWith("url(") && !PALETTE.includes(scene.background.toUpperCase())) {
      issues.push({ id: `bg-${i}`, severity: "warning", message: `Scen ${n}: bakgrunden ${scene.background} finns inte i paletten` });
    }
  });

  if (!PALETTE.includes(config.backgroundColor.toUpperCase())) {
    issues.push({ id: "bg", severity: "warning", message: `Bakgrunden ${config.backgroundColor} finns inte i paletten` });
  }

  const total = config.scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
  if (total > 15) {
    issues.push({ id: "total", severity: "warning", message: `Videon är ${total.toFixed(1)} s — Nordeas annonser är 6–8 s, högst 15 s` });
  }

  // Juridik: konsumentkrediter kräver Konsumentverkets varning.
  if (!onlyMortgage && !config.legal?.creditWarning) {
    issues.push({
      id: "credit-warning",
      severity: "error",
      message: "Konsumentkredit utan Konsumentverkets varning — varningsbandet läggs till",
      fix: config.legal
        ? [{ op: "add", path: "/legal/creditWarning", value: {} }]
        : [{ op: "add", path: "/legal", value: { creditWarning: {} } }],
    });
  }
  if (!onlyMortgage && !config.scenes.some((s) => s.type === "terms")) {
    issues.push({ id: "credit-terms", severity: "warning", message: "Konsumentkredit utan villkor eller räkneexempel (lägg till en villkorsscen med riktiga siffror)" });
  }
  if (INVEST_WORDS.some((w) => text.includes(w)) && !config.legal?.riskNote) {
    issues.push({
      id: "risk-note",
      severity: "error",
      message: "Investering utan riskupplysning — riskraden läggs till",
      fix: config.legal
        ? [{ op: "add", path: "/legal/riskNote", value: "Investeringar innebär en risk." }]
        : [{ op: "add", path: "/legal", value: { riskNote: "Investeringar innebär en risk." } }],
    });
  }

  const headlines = config.scenes.map(headlineOf).filter((h): h is string => !!h && h.split(/\s+/).length >= 3);
  if (headlines.length > 0 && !headlines.some((h) => h.includes("**"))) {
    issues.push({ id: "bold", severity: "info", message: "Inga fetade nyckelord — Nordeas rubriker fetar oftast ett nyckelord" });
  }

  return issues;
}
