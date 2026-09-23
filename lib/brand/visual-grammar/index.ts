// ── Nordea Visual Grammar — laddning + prompt-block ──
//
// visual-grammar.json fylls av Claude Code-skillen `nordea-visual-grammar`
// utifrån Nordeas befintliga annonser (se brand-reference/README.md).
// Så länge filen har status "empty" påverkar den ingenting.

import rawGrammar from "./visual-grammar.json";
import { VisualGrammarSchema, type VisualGrammar } from "./schema";

let cached: VisualGrammar | null | undefined;

/** Returnerar grammatiken, eller null om den är tom eller ogiltig. */
export function getVisualGrammar(): VisualGrammar | null {
  if (cached !== undefined) return cached;
  const parsed = VisualGrammarSchema.safeParse(rawGrammar);
  if (!parsed.success) {
    console.error(
      "[visual-grammar] visual-grammar.json är ogiltig — kör `npm run brand:validate`",
      parsed.error.issues.slice(0, 3)
    );
    cached = null;
  } else {
    cached = parsed.data.status === "empty" ? null : parsed.data;
  }
  return cached;
}

const MAX_GOLDEN_EXAMPLES = 3;

/**
 * Prompt-block som beskriver Nordeas visuella stil för VideoConfig-generering.
 * Tom sträng när ingen grammatik finns — anroparen kan alltid lägga till den.
 */
export function buildVisualGrammarPrompt(grammar = getVisualGrammar()): string {
  if (!grammar) return "";

  const sections: string[] = [];
  sections.push(
    `NORDEAS VISUELLA GRAMMATIK (härledd från ${grammar.source_ad_ids.length} befintliga annonser${
      grammar.status === "draft" ? ", utkast — ej granskad" : ""
    }):`
  );
  if (grammar.summary) sections.push(grammar.summary);

  // Grammatiken är varumärkets ramar, inte en mallbok: arketyper, recept och
  // exempel är beprövade utgångslägen som AI:n får bryta när idén kräver det.
  sections.push(
    "SÅ ANVÄNDER DU GRAMMATIKEN:\n" +
      "- FASTA RAMAR (följ alltid): färgpalett, typografi (Nordea Sans, **fet** på nyckelord), stilla logga, juridisk text (villkor, varningsband, riskrad), tonalitet och UNDVIK-listan.\n" +
      "- INSPIRATION (fritt att bryta): layout-arketyper, rörelserecept och referensannonser. Använd dem som utgångsläge när användaren inte ber om något specifikt.\n" +
      "- Användarens prompt går före inspirationen. Ber hen om en ny idé, komposition eller animation: skapa den fritt — gärna som canvas-scen med egen animation — inom de fasta ramarna. Kopiera aldrig en referensannons rakt av."
  );

  if (grammar.layout_archetypes.length > 0) {
    sections.push(
      "LAYOUT-ARKETYPER (beprövade utgångslägen — nya kompositioner är välkomna inom ramarna):\n" +
        grammar.layout_archetypes
          .map(
            (a) =>
              `- ${a.id} — ${a.name}: ${a.description} Format: ${a.aspect_ratios.join(", ")}. Scentyper: ${a.scene_types.join(", ")}. Passar för: ${a.best_for.join(", ")}.`
          )
          .join("\n")
    );
  }

  const rules = (title: string, items: { rule: string }[]) =>
    items.length > 0 ? `${title}\n${items.map((r) => `- ${r.rule}`).join("\n")}` : "";
  sections.push(rules("FÄRG:", grammar.color_rules));
  sections.push(rules("TYPOGRAFI:", grammar.typography_rules));

  if (grammar.illustration_style) {
    const s = grammar.illustration_style;
    sections.push(
      `ILLUSTRATIONSSTIL: ${s.summary}\nÅterkommande motiv: ${s.recurring_motifs.join(", ")}.\nGör: ${s.do.join("; ")}.\nUndvik: ${s.dont.join("; ")}.`
    );
  }
  if (grammar.photography_style) {
    const s = grammar.photography_style;
    sections.push(`FOTOSTIL: ${s.summary}\nGör: ${s.do.join("; ")}.\nUndvik: ${s.dont.join("; ")}.`);
  }

  if (grammar.motion_recipes.length > 0) {
    sections.push(
      "RÖRELSERECEPT (standardval för VideoConfig.motion — avvik när idén kräver det, men behåll det lugna tempot):\n" +
        grammar.motion_recipes
          .map(
            (r) =>
              `- ${r.id} — ${r.name}: ${r.description} Använd när: ${r.when_to_use}. Scenordning: ${r.scene_sequence.join(" → ")}. Längd ca ${r.typical_duration_s}s.${
                r.text_animation ? ` Textanimation: ${r.text_animation}.` : ""
              }\n  motion: ${JSON.stringify(r.motion)}`
          )
          .join("\n")
    );
  }

  if (grammar.copy_patterns.length > 0) {
    sections.push(
      "COPY-MÖNSTER:\n" +
        grammar.copy_patterns.map((p) => `- ${p.pattern} (ex: "${p.example}")`).join("\n")
    );
  }
  sections.push(rules("GÖR (standard — användarens uttryckliga önskemål går före, utom logga och juridik):", grammar.do));
  sections.push(rules("UNDVIK:", grammar.dont));

  const examples = grammar.golden_examples.slice(0, MAX_GOLDEN_EXAMPLES);
  if (examples.length > 0) {
    sections.push(
      "REFERENSANNONSER SOM VIDEOCONFIG (exempel på hur ramarna kan se ut i praktiken — inspiration, inte mallar; kopiera inte copy):\n" +
        examples
          .map((e) => `// ${e.ad_id}: ${e.why}\n${JSON.stringify(e.video_config)}`)
          .join("\n\n")
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

/** Lägger till grammatiken sist i en systemprompt (no-op när den är tom). */
export function withVisualGrammar(systemPrompt: string): string {
  const block = buildVisualGrammarPrompt();
  return block ? `${systemPrompt}\n\n${block}` : systemPrompt;
}
